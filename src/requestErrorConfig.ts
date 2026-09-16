import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { history } from '@umijs/max';
import { message } from 'antd';
import { getToken } from '@/services/ant-design-pro/api';

const LOGIN_PATH = '/user/login';

/** 踢回登录页并携带当前位置（登录页有 isAllowedRedirect 白名单校验，会话过期重登后能回到原页面） */
function redirectToLogin() {
  const { pathname, search } = history.location;
  if (pathname === LOGIN_PATH) {
    return;
  }
  history.push(
    `${LOGIN_PATH}?redirect=${encodeURIComponent(pathname + search)}`,
  );
}

export const errorConfig: RequestConfig = {
  errorConfig: {
    errorThrower: (res) => {
      const { code, msg } = res as any;
      if (code !== undefined && code !== 200) {
        const error: any = new Error(msg || '请求失败');
        error.name = 'BizError';
        error.info = { code, msg };
        throw error;
      }
    },
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;
      if (error.name === 'BizError') {
        message.error(error.info?.msg || '请求失败');
      } else if (error.response) {
        if (error.response.status === 401) {
          localStorage.removeItem('degel_access_token');
          redirectToLogin();
          return;
        }
        message.error(`请求错误：${error.response.status}`);
      } else if (error.request) {
        message.error('网络异常，请检查网络连接');
      } else {
        message.error('请求异常');
      }
    },
  },
  requestInterceptors: [
    (config: RequestOptions) => {
      const token = getToken();
      if (token) {
        // headers 可能未初始化，先兜底再写入，否则 Authorization 会静默丢失
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
  ],
};
