export default function access(initialState: { currentUser?: API.CurrentUser } | undefined) {
  const { currentUser } = initialState ?? {};
  const permissions = currentUser?.permissions || [];
  const roles = currentUser?.roles || [];

  return {
    canAdmin: roles.includes('admin'),
    hasPermission: (perm: string) => permissions.includes(perm),
  };
}
