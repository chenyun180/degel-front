import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import React from 'react';
import {
  AppstoreOutlined,
  AuditOutlined,
  BarChartOutlined,
  DashboardOutlined,
  HomeOutlined,
  MenuOutlined,
  OrderedListOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { AvatarDropdown, AvatarName } from '@/components';
import PageTabs from '@/components/PageTabs';
import { currentUser as queryCurrentUser } from '@/services/ant-design-pro/api';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';

const iconMap: Record<string, React.ReactNode> = {
  HomeOutlined: <HomeOutlined />,
  SettingOutlined: <SettingOutlined />,
  UserOutlined: <UserOutlined />,
  TeamOutlined: <TeamOutlined />,
  MenuOutlined: <MenuOutlined />,
  ShopOutlined: <ShopOutlined />,
  ShoppingOutlined: <ShoppingOutlined />,
  AuditOutlined: <AuditOutlined />,
  AppstoreOutlined: <AppstoreOutlined />,
  DashboardOutlined: <DashboardOutlined />,
  OrderedListOutlined: <OrderedListOutlined />,
  BarChartOutlined: <BarChartOutlined />,
};

const loginPath = '/user/login';

export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
}> {
  const fetchUserInfo = async () => {
    try {
      const response = await queryCurrentUser({ skipErrorHandler: true });
      if (response.code === 200 && response.data) {
        return response.data;
      }
    } catch (_error) {
      // ignore
    }
    history.push(loginPath);
    return undefined;
  };

  const { location } = history;
  if (location.pathname !== loginPath) {
    const token = localStorage.getItem('degel_access_token');
    if (!token) {
      history.push(loginPath);
      return { fetchUserInfo, settings: defaultSettings as Partial<LayoutSettings> };
    }
    const currentUser = await fetchUserInfo();
    return {
      fetchUserInfo,
      currentUser,
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  }
  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

function routersToMenuData(routers: API.RouterItem[]): any[] {
  return routers
    .filter((r) => !r.hidden)
    .map((r) => ({
      name: r.meta?.title || r.name,
      path: r.path,
      icon: r.meta?.icon ? iconMap[r.meta.icon] : undefined,
      children: r.children ? routersToMenuData(r.children) : undefined,
    }));
}

export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  const routers: API.RouterItem[] = initialState?.currentUser?.routers || [];

  return {
    avatarProps: {
      src: initialState?.currentUser?.user?.avatar || undefined,
      title: <AvatarName />,
      render: (_: any, avatarChildren: any) => (
        <AvatarDropdown>{avatarChildren}</AvatarDropdown>
      ),
    },
    waterMarkProps: {
      content: initialState?.currentUser?.user?.nickname,
    },
    onPageChange: () => {
      const { location } = history;
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
    menuDataRender: routers.length > 0 ? () => routersToMenuData(routers) : undefined,
    menuHeaderRender: undefined,
    childrenRender: (children) => {
      return (
        <>
          <PageTabs routers={routers} currentPath={history.location.pathname} />
          {children}
        </>
      );
    },
    ...initialState?.settings,
  };
};

export const request: RequestConfig = {
  ...errorConfig,
};
