import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import ImageUpload from './ImageUpload';

jest.mock('@/services/ant-design-pro/api', () => ({
  uploadFile: jest.fn(async () => ({ code: 200, msg: 'success', data: 'http://cdn/a.jpg' })),
}));

describe('ImageUpload', () => {
  test('renders existing preview and removes it', async () => {
    const handleChange = jest.fn();

    render(
      React.createElement(ImageUpload, {
        value: 'http://cdn/exist.jpg',
        onChange: handleChange,
      }),
    );

    expect(screen.getByText('已上传图片')).toBeTruthy();
    fireEvent.click(screen.getByText('移除图片'));
    expect(handleChange).toHaveBeenCalledWith('');
  });

  test('uploads file and writes returned url', async () => {
    const handleChange = jest.fn();

    render(React.createElement(ImageUpload, { onChange: handleChange }));

    const input = screen.getByLabelText('上传图片') as HTMLInputElement;
    const file = new File(['abc'], 'demo.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith('http://cdn/a.jpg');
    });
  });
});
