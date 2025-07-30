import { createVNode, render, VNode } from 'vue';

import Loading from './index.vue';

const vnode: VNode = createVNode(Loading) as VNode;

export const vLoading = {
  // 在绑定元素的父组件 及他自己的所有子节点都挂载完成后调用
  mounted: (el: HTMLElement) => {
    render(vnode, el);
  },
  // 在绑定元素的父组件 及他自己的所有子节点都更新后调用
  updated: (el: HTMLElement, binding: any) => {
    if (binding.value) {
      vnode?.component?.exposed?.show();
    } else {
      vnode?.component?.exposed?.hide();
    }
    // 动态添加删除自定义class: loading-parent
    formatterClass(el, binding);
  },
  // 绑定元素的父组件卸载后调用
  unmounted: () => {
    vnode?.component?.exposed?.hide();
  }
};

function formatterClass(el: HTMLElement, binding: any) {
  const classStr = el.getAttribute('class') || '';
  const targetClass = classStr.indexOf('loading-parent');

  if (binding.value) {
    // 添加 loading-parent 类
    if (targetClass === -1) {
      el.setAttribute('class', `${classStr} loading-parent`.trim());
    }
  } else if (targetClass > -1) {
    // 移除 loading-parent 类
    const newClassStr = classStr.replace(/\s*loading-parent\s*/g, ' ').trim();
    el.setAttribute('class', newClassStr);
  }
}
