/**
 * 图片/文件 URL 组装。
 * 库里存的是 objectKey（bucket/objectName），不含 host —— 环境差异由后端配置承担。
 * 前端一律用相对路径经网关访问；兼容历史数据里残留的完整 URL（http 开头原样返回）。
 */
export const fileUrl = (key?: string | null): string => {
  if (!key) {
    return '';
  }
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }
  return `/file/view/${key}`;
};
