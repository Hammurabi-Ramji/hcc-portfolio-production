const paths = { modules: 'modules', flows: 'flows', chat: 'chat', code: 'code' };

export function readRoute() {
  const path = window.location.hash.replace(/^#\/?/, '').split(/[/?]/)[0];
  return paths[path] || 'modules';
}

export function navigate(route) {
  window.location.hash = `/${paths[route] || 'modules'}`;
}

export function watchRoute(change) {
  const update = () => change(readRoute());
  window.addEventListener('hashchange', update);
  if (!window.location.hash || !paths[window.location.hash.replace(/^#\/?/, '').split(/[/?]/)[0]]) navigate('modules');
  update();
  return () => window.removeEventListener('hashchange', update);
}
