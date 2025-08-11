import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

import homeRouter from '@/router/home';

export const useMenuStore = defineStore('menu', () => {
  const menus = ref<RouteRecordRaw[]>(homeRouter as RouteRecordRaw[]);

  const setMenus = (newMenus: RouteRecordRaw[]) => {
    menus.value = newMenus;
  };

  return {
    menus,
    setMenus
  };
});
