import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components';
import type { EChartsCoreOption } from 'echarts/core';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import React, { useEffect, useRef } from 'react';

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

type EChartProps = {
  option: EChartsCoreOption;
  height?: number;
  loading?: boolean;
  style?: React.CSSProperties;
};

/**
 * echarts 通用包装：init / setOption(notMerge) / 自适应 resize / 卸载 dispose。
 * 按需注册了折线图所需组件；如需其它图表类型请在 echarts.use 中补充注册。
 */
const EChart: React.FC<EChartProps> = ({
  option,
  height = 320,
  loading = false,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }
    const chart = echarts.init(containerRef.current);
    chartRef.current = chart;

    const observer = new ResizeObserver(() => {
      chart.resize();
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true });
  }, [option]);

  useEffect(() => {
    if (loading) {
      chartRef.current?.showLoading('default', {
        text: '',
        color: '#1677ff',
        maskColor: 'rgba(255, 255, 255, 0.6)',
      });
    } else {
      chartRef.current?.hideLoading();
    }
  }, [loading]);

  return <div ref={containerRef} style={{ height, width: '100%', ...style }} />;
};

export default EChart;
