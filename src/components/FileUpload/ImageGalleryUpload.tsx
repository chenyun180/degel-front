import { Button, Image, message, Space, Spin } from 'antd';
import React, { useRef, useState } from 'react';
import { uploadFile } from '@/services/ant-design-pro/api';

type ImageGalleryUploadProps = {
  value?: string[];
  onChange?: (value: string[]) => void;
  bucket?: 'public' | 'private';
};

const ImageGalleryUpload: React.FC<ImageGalleryUploadProps> = ({
  value = [],
  onChange,
  bucket = 'public',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    setUploading(true);
    try {
      const res = await uploadFile(file, bucket);
      if (res.code === 200 && res.data) {
        onChange?.([...value, res.data]);
        message.success('上传成功');
        return;
      }
      message.error(res.msg || '上传失败');
    } catch {
      message.error('上传失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        aria-label="上传轮播图"
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Button
        type="dashed"
        loading={uploading}
        onClick={() => inputRef.current?.click()}
      >
        上传图片
      </Button>
      {uploading ? <Spin size="small" style={{ marginLeft: 8 }} /> : null}
      <Space wrap size={12} style={{ marginTop: 12 }}>
        {value.map((url) => (
          <div key={url} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Image
              src={url}
              alt="gallery"
              width={72}
              height={72}
              style={{ objectFit: 'cover', borderRadius: 6 }}
            />
            <Button
              danger
              size="small"
              onClick={() => onChange?.(value.filter((item) => item !== url))}
            >
              删除
            </Button>
          </div>
        ))}
      </Space>
    </div>
  );
};

export default ImageGalleryUpload;
