import '@wangeditor/editor/dist/css/style.css';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import { message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { uploadFile } from '@/services/ant-design-pro/api';

type RichTextEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '请输入内容',
}) => {
  const [editor, setEditor] = useState<IDomEditor | null>(null);

  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  const toolbarConfig = useMemo<Partial<IToolbarConfig>>(
    () => ({
      excludeKeys: ['group-video'],
    }),
    [],
  );

  const editorConfig = useMemo<Partial<IEditorConfig>>(
    () => ({
      placeholder,
      MENU_CONF: {
        uploadImage: {
          async customUpload(file: File, insertFn: (url: string, alt?: string, href?: string) => void) {
            try {
              const res = await uploadFile(file, 'public');
              if (res.code === 200 && res.data) {
                insertFn(res.data, file.name, res.data);
                return;
              }
              message.error(res.msg || '图片上传失败');
            } catch {
              message.error('图片上传失败');
            }
          },
        },
      },
    }),
    [placeholder],
  );

  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
      <Toolbar editor={editor} defaultConfig={toolbarConfig} mode="default" />
      <Editor
        defaultConfig={editorConfig}
        value={value}
        onCreated={setEditor}
        onChange={(currentEditor) => onChange?.(currentEditor.getHtml())}
        mode="default"
        style={{ height: 320, overflowY: 'hidden' }}
      />
    </div>
  );
};

export default RichTextEditor;
