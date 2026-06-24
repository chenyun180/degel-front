import { Button, Image, message, Spin } from 'antd';
import React, { useRef, useState } from 'react';
import { uploadFile } from '@/services/ant-design-pro/api';

type ImageUploadProps = {
  value?: string;
  onChange?: (value: string) => void;
  bucket?: 'public' | 'private';
  buttonText?: string;
};

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  bucket = 'public',
  buttonText = '上传图片',
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
        onChange?.(res.data);
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
        aria-label={buttonText}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Button
          type="default"
          loading={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {buttonText}
        </Button>
        {uploading ? <Spin size="small" /> : null}
        {value ? (
          <>
            <span>已上传图片</span>
            <Image
              src={value}
              alt="uploaded"
              width={64}
              height={64}
              style={{ objectFit: 'cover', borderRadius: 6 }}
            />
            <Button danger type="link" onClick={() => onChange?.('')}>
              移除图片
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ImageUpload;
