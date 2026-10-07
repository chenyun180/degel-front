import { Alert, Empty, Spin, Tag, Timeline } from 'antd';
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import React, { useEffect, useRef, useState } from 'react';
import './index.less';

type Props = {
  /** 拉取进度图数据的函数（店铺侧/平台侧接口不同，鉴权也不同）；仅挂载时调用一次，切换数据用 key 重挂载 */
  load: () => Promise<API.R<API.FlowDiagram>>;
};

const stateTag: Record<
  API.FlowDiagram['state'],
  { text: string; color: string }
> = {
  running: { text: '进行中', color: 'processing' },
  completed: { text: '已结束', color: 'success' },
  terminated: { text: '已终止', color: 'default' },
};

/** 时间线只展示有业务含义的节点，网关/连线略过 */
const TIMELINE_TYPES = ['startEvent', 'userTask', 'serviceTask', 'endEvent'];

/** 连线条件表达式 → 简短展示（${approved} → approved；${!approved} → !approved） */
const shortCondition = (body?: string) =>
  (body || '')
    .trim()
    .replace(/^\$\{\s*/, '')
    .replace(/\s*\}$/, '');

/**
 * 流程进度图：bpmn-js 只读渲染流程定义，按运行轨迹高亮
 * - 绿色：已走过的节点与连线
 * - 橙色闪烁：当前待办节点
 * - 灰色虚线：流程被终止时所在节点（如店铺撤回）
 * - 带条件的连线上标注条件表达式
 */
const FlowDiagram: React.FC<Props> = ({ load }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<API.FlowDiagram | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load()
      .then((res) => {
        if (cancelled) return;
        if (res.code === 200 && res.data) setData(res.data);
        else setError(res.msg || '加载流程图失败');
      })
      .catch(() => !cancelled && setError('加载流程图失败'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // 只在挂载时拉取：调用方常传内联箭头函数，放进依赖会每次渲染重拉；切换数据请用 key 重挂载
  }, []);

  useEffect(() => {
    if (!data || !containerRef.current) return undefined;
    const viewer = new NavigatedViewer({ container: containerRef.current });
    let destroyed = false;

    viewer
      .importXML(data.bpmnXml)
      .then(() => {
        if (destroyed) return;
        const canvas: any = viewer.get('canvas');
        const registry: any = viewer.get('elementRegistry');
        const overlays: any = viewer.get('overlays');

        const activeMarker =
          data.state === 'terminated' ? 'flow-terminated' : 'flow-active';
        // 流程定义改版后旧实例的节点 id 可能已不在图中，先判断存在再加 marker
        const mark = (ids: string[], marker: string) => {
          for (const id of ids) {
            if (registry.get(id)) canvas.addMarker(id, marker);
          }
        };
        mark(data.completedActivityIds, 'flow-done');
        mark(data.completedFlowIds, 'flow-done');
        mark(data.activeActivityIds, activeMarker);

        // 条件标注放在连线最后一段的中点（bpmn-js 原生只显示连线 name，不显示条件）
        registry
          .filter(
            (el: any) =>
              el.type === 'bpmn:SequenceFlow' &&
              el.businessObject?.conditionExpression,
          )
          .forEach((el: any) => {
            const wps = el.waypoints || [];
            if (wps.length < 2) return;
            const a = wps[wps.length - 2];
            const b = wps[wps.length - 1];
            const minX = Math.min(...wps.map((p: any) => p.x));
            const minY = Math.min(...wps.map((p: any) => p.y));
            const html = document.createElement('div');
            html.className = 'flow-condition';
            html.title = `条件表达式：${el.businessObject.conditionExpression.body}`;
            html.textContent = shortCondition(
              el.businessObject.conditionExpression.body,
            );
            overlays.add(el.id, {
              position: {
                left: (a.x + b.x) / 2 - minX - 20,
                top: (a.y + b.y) / 2 - minY + 4,
              },
              html,
            });
          });

        canvas.zoom('fit-viewport', 'auto');
      })
      .catch(() => !destroyed && setError('流程图渲染失败'));

    return () => {
      destroyed = true;
      viewer.destroy();
    };
  }, [data]);

  if (loading) return <Spin style={{ display: 'block', padding: 40 }} />;
  if (error) return <Alert type="error" showIcon title={error} />;
  if (!data) return <Empty />;

  const tag = stateTag[data.state];
  const steps = data.steps.filter((s) =>
    TIMELINE_TYPES.includes(s.activityType),
  );

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <Tag color={tag.color}>{tag.text}</Tag>
        {data.processName}
        {data.deleteReason ? `（终止原因：${data.deleteReason}）` : ''}
      </div>
      <div ref={containerRef} className="flow-diagram-canvas" />
      <div className="flow-diagram-legend">
        <span>
          <i style={{ borderColor: '#52c41a', background: '#f6ffed' }} />
          已完成
        </span>
        <span>
          <i style={{ borderColor: '#fa8c16', background: '#fff7e6' }} />
          当前待办
        </span>
        <span>
          <i
            style={{
              borderColor: '#8c8c8c',
              background: '#f5f5f5',
              borderStyle: 'dashed',
            }}
          />
          已终止
        </span>
        <span>滚轮缩放 · 拖拽平移</span>
      </div>
      <Timeline
        items={steps.map((s, idx) => {
          const terminated = !!s.deleteReason;
          const running = !s.endTime;
          return {
            key: `${s.activityId}-${idx}`,
            color: terminated ? 'gray' : running ? 'blue' : 'green',
            loading: running && !terminated,
            title: s.startTime,
            content: (
              <span>
                <b>{s.activityName || s.activityId}</b>
                {s.assigneeName ? ` · 办理人：${s.assigneeName}` : ''}
                {running && !terminated ? ' · 待处理' : ''}
                {terminated ? ` · 已终止（${s.deleteReason}）` : ''}
              </span>
            ),
          };
        })}
      />
    </div>
  );
};

export default FlowDiagram;
