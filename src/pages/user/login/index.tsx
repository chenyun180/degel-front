import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { Helmet, useModel } from '@umijs/max';
import { App } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';
import { flushSync } from 'react-dom';
import { login, setToken } from '@/services/ant-design-pro/api';
import {
  collectAllowedPaths,
  firstNavigablePath,
  isAllowedRedirect,
} from '@/utils/routeAccess';
import Settings from '../../../../config/defaultSettings';

const useStyles = createStyles(({ token }) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'auto',
    backgroundImage:
      "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
    backgroundSize: '100% 100%',
  },
}));

const Login: React.FC = () => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const { styles } = useStyles();
  const { message } = App.useApp();

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      flushSync(() => {
        setInitialState((s) => ({ ...s, currentUser: userInfo }));
      });
    }
    return userInfo;
  };

  const handleSubmit = async (values: API.LoginParams) => {
    try {
      const result = await login(values);
      if (result.access_token) {
        setToken(result.access_token);
        message.success('登录成功！');
        const userInfo = await fetchUserInfo();
        // 跳转优先级：合法的 redirect > 菜单首项 > 角色兜底 > /welcome
        const urlParams = new URL(window.location.href).searchParams;
        const redirect = urlParams.get('redirect') || '';
        const allowed = collectAllowedPaths(userInfo?.routers);
        const target = isAllowedRedirect(redirect, allowed)
          ? redirect
          : firstNavigablePath(userInfo?.routers) ||
            (userInfo?.roles?.includes('admin')
              ? '/platform/dashboard'
              : '/shop-workspace/shop-dashboard') ||
            '/welcome';
        window.location.href = target;
        return;
      }
      message.error(result.error_description || '登录失败');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error_description || error?.data?.error_description || '登录失败，请重试';
      message.error(errorMsg);
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>登录 - {Settings.title}</title>
      </Helmet>
      <div style={{ flex: '1', padding: '32px 0' }}>
        <LoginForm
          contentStyle={{ minWidth: 280, maxWidth: '75vw' }}
          logo={<img alt="logo" src="/logo.svg" />}
          title={Settings.title}
          subTitle="B2B2C 多租户商城管理系统"
          onFinish={async (values) => {
            await handleSubmit(values as API.LoginParams);
          }}
        >
          <ProFormText
            name="username"
            fieldProps={{ size: 'large', prefix: <UserOutlined /> }}
            placeholder="用户名: admin"
            rules={[{ required: true, message: '请输入用户名!' }]}
          />
          <ProFormText.Password
            name="password"
            fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
            placeholder="密码: admin123"
            rules={[{ required: true, message: '请输入密码!' }]}
          />
        </LoginForm>
      </div>
    </div>
  );
};

export default Login;
