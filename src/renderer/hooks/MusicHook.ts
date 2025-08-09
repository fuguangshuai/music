import { cloneDeep } from 'lodash';
import { createDiscreteApi } from 'naive-ui';
import { computed, getCurrentInstance, nextTick, onUnmounted, ref, watch } from 'vue';

import useIndexedDB from '@/hooks/IndexDBHook';
import { audioService } from '@/services/audioService';
import type { usePlayerStore } from '@/store';
import { getSongUrl } from '@/store/modules/player';
import type { Artist, ILyricText, SongResult } from '@/type/music';
import { isElectron } from '@/utils';
import { getTextColors, type ITextColors } from '@/utils/linearColor';

// 全局定时器管理
declare global {
  interface Window {
    musicHookTimers: NodeJS.Timeout[];
  }
}

const windowData = window as Window & { musicHookTimers?: NodeJS.Timeout[] };

// 全局 playerStore 引用，通过 initMusicHook 函数注入
let playerStore: ReturnType<typeof usePlayerStore> | null = null;

// 初始化函数，接受 store 实例
export const initMusicHook = (store: ReturnType<typeof usePlayerStore>) => {
  playerStore = store;

  // 创建 computed 属性
  playMusic = computed(() => getPlayerStore().playMusic as SongResult);
  artistList = computed(
    () => (getPlayerStore().playMusic.ar || getPlayerStore().playMusic?.song?.artists) as Artist[]
  );

  // 在 store 注入后初始化需要 store 的功能
  setupKeyboardListeners();
  initProgressAnimation();
  setupMusicWatchers();
  setupCorrectionTimeWatcher();
  setupPlayStateWatcher();
};

// 获取 playerStore 的辅助函数
const getPlayerStore = () => {
  if (!playerStore) {
    throw new Error('MusicHook not initialized. Call initMusicHook, first.');
  }
  return playerStore;
};
export const lrcArray = ref<ILyricText[]>([]); // 歌词数组
export const lrcTimeArray = ref<number[]>([0]); // 歌词时间数组
export const nowTime = ref(0); // 当前播放时间
export const allTime = ref(0); // 总播放时间
export const nowIndex = ref(0); // 当前播放歌词
export const currentLrcProgress = ref(0); // 来存储当前歌词的进度
export const sound = ref<Howl | null>(audioService.getCurrentSound());
export const isLyricWindowOpen = ref(false); // 新增状态
export const textColors = ref<ITextColors>(getTextColors());

// 这些 computed 属性需要在初始化后创建
export let playMusic: ComputedRef<SongResult>;
export let artistList: ComputedRef<Artist[]>;

export const musicDB = await useIndexedDB('musicDB', [
  { name: 'music', keyPath: 'id' },
  { name: 'music_lyric', keyPath: 'id' },
  { name: 'api_cache', keyPath: 'id' }
]);

// 键盘事件处理器，在初始化后设置
const setupKeyboardListeners = () => {
  document.onkeyup = (e) => {
    // 检查事件目标是否是输入框元素
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    const store = getPlayerStore();
    switch (e.code) {
      case 'Space':
        console.log('空格键播放/暂停，当前状态: ', store.play ? '播放' : '暂停');
        // 使用统一的播放/暂停逻辑
        store.setPlay(store.playMusic);
        break;
      default:
    }
  };
};

const { message } = createDiscreteApi(['message']);

// 全局变量
let progressAnimationInitialized = false;
let globalAnimationFrameId: number | null = null;
let debounceTimer: NodeJS.Timeout | null = null;
const lastSavedTime = ref(0);

// 存储所有 watch 停止函数
const watchStopFunctions: Array<() => void> = [];

// 清理所有MusicHook定时器的函数
export const clearAllMusicHookTimers = () => {
  if (window.musicHookTimers) {
    window.musicHookTimers.forEach((timer) => {
      try {
        clearTimeout(timer);
      } catch (error) {
        console.error('清理MusicHook定时器失败:', error);
      }
    });
    window.musicHookTimers = [];
  }
};

// 全局停止函数
const stopProgressAnimation = () => {
  if (globalAnimationFrameId) {
    cancelAnimationFrame(globalAnimationFrameId);
    globalAnimationFrameId = null;
  }
};

// 全局更新函数
const updateProgress = () => {
  if (!getPlayerStore().play) {
    stopProgressAnimation();
    return;
  }

  const currentSound = sound.value;
  if (!currentSound) {
    console.log('进度更新：无效的 sound, 对象');
    // 不是立即返回，而是设置定时器稍后再次尝试
    globalAnimationFrameId = setTimeout(() => {
      requestAnimationFrame(updateProgress);
    }, 100) as unknown as number;
    return;
  }

  if (typeof currentSound.seek !== 'function') {
    console.log('进度更新：无效的 seek, 函数');
    // 不是立即返回，而是设置定时器稍后再次尝试
    globalAnimationFrameId = setTimeout(() => {
      requestAnimationFrame(updateProgress);
    }, 100) as unknown as number;
    return;
  }

  try {
    const { start, end } = currentLrcTiming.value;
    if (typeof start !== 'number' || typeof end !== 'number' || start === end) {
      globalAnimationFrameId = requestAnimationFrame(updateProgress);
      return;
    }

    let currentTime;
    try {
      // 获取当前播放位置
      currentTime = currentSound.seek() as number;

      // 减少更新频率，避免频繁更新UI
      const timeDiff = Math.abs(currentTime - nowTime.value);
      if (timeDiff > 0.2 || Math.floor(currentTime) !== Math.floor(nowTime.value)) {
        nowTime.value = currentTime;
      }

      // 保存当前播放进度到 localStorage (每秒保存一次，避免频繁写入)
      if (
        Math.floor(currentTime) % 2 === 0 &&
        Math.floor(currentTime) !== Math.floor(lastSavedTime.value)
      ) {
        lastSavedTime.value = currentTime;
        if (getPlayerStore().playMusic && getPlayerStore().playMusic.id) {
          localStorage.setItem(
            'playProgress',
            JSON.stringify({
              songId: getPlayerStore().playMusic.id,
              progress: currentTime
            })
          );
        }
      }
    } catch (seekError) {
      console.error('调用, seek() 方法出错:', seekError);
      globalAnimationFrameId = requestAnimationFrame(updateProgress);
      return;
    }

    if (typeof currentTime !== 'number' || Number.isNaN(currentTime)) {
      console.error('无效的当前时间:', currentTime);
      globalAnimationFrameId = requestAnimationFrame(updateProgress);
      return;
    }

    const elapsed = currentTime - start;
    const duration = end - start;
    const progress = (elapsed / duration) * 100;

    // 确保进度在 0-100 之间
    currentLrcProgress.value = Math.min(Math.max(progress, 0), 100);
  } catch (error) {
    console.error('更新进度出错:', error);
  }

  // 继续下一帧更新，但降低更新频率为60帧中更新10帧
  globalAnimationFrameId = setTimeout(() => {
    requestAnimationFrame(updateProgress);
  }, 100) as unknown as number;
};

// 全局启动函数
const startProgressAnimation = () => {
  stopProgressAnimation(); // 先停止之前的动画
  updateProgress();
};

// 全局初始化函数
const initProgressAnimation = () => {
  if (progressAnimationInitialized) return;

  console.log('初始化进度动画');
  progressAnimationInitialized = true;

  // 监听播放状态变化，这里使用防抖，避免频繁触发
  const stopPlayStateWatch = watch(
    () => getPlayerStore().play,
    (newIsPlaying) => {
      console.log('播放状态变化:', newIsPlaying);

      // 清除之前的定时器
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // 使用防抖，延迟 100ms 再执行
      debounceTimer = setTimeout(() => {
        if (newIsPlaying) {
          // 确保 sound 对象有效时才启动进度更新
          if (sound.value) {
            console.log('sound, 对象已存在，立即启动进度更新');
            startProgressAnimation();
          } else {
            console.log('等待 sound, 对象初始化...');
            // 定时检查 sound 对象是否已初始化
            const checkInterval = setInterval(() => {
              if (sound.value) {
                clearInterval(checkInterval);
                console.log('sound, 对象已初始化，开始进度更新');
                startProgressAnimation();
              }
            }, 100);
            // 设置超时，防止无限等待
            setTimeout(() => {
              clearInterval(checkInterval);
              console.log('等待 sound, 对象超时，已停止等待');
            }, 5000);
          }
        } else {
          stopProgressAnimation();
        }
      }, 100);
    }
  );
  watchStopFunctions.push(stopPlayStateWatch);

  // 监听当前歌词索引变化
  const stopNowIndexWatch = watch(nowIndex, () => {
    currentLrcProgress.value = 0;
    if (getPlayerStore().play) {
      startProgressAnimation();
    }
  });
  watchStopFunctions.push(stopNowIndexWatch);

  // 监听音频对象变化
  const stopSoundWatch = watch(sound, (newSound) => {
    console.log('sound 对象变化:', !!newSound);
    if (newSound && getPlayerStore().play) {
      startProgressAnimation();
    }
  });
  watchStopFunctions.push(stopSoundWatch);
};

// 设置音乐相关的监听器
const setupMusicWatchers = () => {
  const store = getPlayerStore();

  // 监听 playerStore.playMusic 的变化以更新歌词数据
  const stopPlayMusicWatch = watch(
    () => store.playMusic,
    () => {
      nextTick(async () => {
        console.log('歌曲切换，更新歌词数据');
        // 更新歌词数据
        lrcArray.value = playMusic.value.lyric?.lrcArray || [];
        lrcTimeArray.value = playMusic.value.lyric?.lrcTimeArray || [];

        // 当歌词数据更新时，如果歌词窗口打开，则发送数据
        if (isElectron && isLyricWindowOpen.value) {
          console.log('歌词窗口已打开，同步最新歌词数据');
          // 不管歌词数组是否为空，都发送最新数据
          sendLyricToWin();

          // 再次延迟发送，确保歌词窗口已完全加载
          const lyricSendTimer = setTimeout(() => {
            sendLyricToWin();
          }, 500);

          // 存储定时器以便可能的清理
          if (!window.musicHookTimers) {
            window.musicHookTimers = [];
          }
          window.musicHookTimers.push(lyricSendTimer);
        }
      });
    },
    {
      deep: true,
      immediate: true
    }
  );
  watchStopFunctions.push(stopPlayMusicWatch);
};

const setupAudioListeners = () => {
  let interval: number | null = null;

  const clearInterval = () => {
    if (interval) {
      window.clearInterval(interval);
      interval = null;
    }
  };

  // 清理所有事件监听器
  audioService.clearAllListeners();

  // 监听seek开始事件，立即更新UI
  audioService.on('seek_start', (time) => {
    // 直接更新显示位置，不检查拖动状态
    nowTime.value = time;
  });

  // 监听seek完成事件
  audioService.on('seek', () => {
    try {
      const currentSound = sound.value;
      if (currentSound) {
        // 立即更新显示时间，不进行任何检查
        const currentTime = currentSound.seek() as number;
        if (typeof currentTime === 'number' && !Number.isNaN(currentTime)) {
          nowTime.value = currentTime;

          // 检查是否需要更新歌词
          const newIndex = getLrcIndex(nowTime.value);
          if (newIndex !== nowIndex.value) {
            nowIndex.value = newIndex;
            if (isElectron && isLyricWindowOpen.value) {
              sendLyricToWin();
            }
          }
        }
      }
    } catch (error) {
      console.error('处理seek事件出错:', error);
    }
  });

  // 立即更新一次时间和进度（解决初始化时进度条不显示问题）
  const updateCurrentTimeAndDuration = () => {
    const currentSound = audioService.getCurrentSound();
    if (currentSound) {
      try {
        // 更新当前时间和总时长
        const currentTime = currentSound.seek() as number;
        if (typeof currentTime === 'number' && !Number.isNaN(currentTime)) {
          nowTime.value = currentTime;
          allTime.value = currentSound.duration() as number;
        }
      } catch (error) {
        console.error('初始化时间和进度失败:', error);
      }
    }
  };

  // 立即执行一次更新
  updateCurrentTimeAndDuration();

  // 监听播放
  audioService.on('play', () => {
    console.log('音频播放事件触发');
    const store = getPlayerStore();

    console.log('当前用户播放意图:', store.userPlayIntent);
    console.log('当前播放状态:', store.play);

    // 只有在用户意图是播放时才更新播放状态
    // 这防止暂停过程中的意外播放事件干扰用户意图
    console.log('🔍 检查用户播放意图:', store.userPlayIntent);
    if (store.userPlayIntent) {
      console.log('✅, 用户意图播放，更新播放状态为true');
      store.setPlayMusic(true);

      if (isElectron) {
        window.api.sendSong(cloneDeep(store.playMusic));
      }
    } else {
      console.log('❌, 用户意图暂停，忽略播放事件，保持暂停状态');
      // 如果用户意图是暂停，但音频开始播放了，强制暂停
      const currentSound = audioService.getCurrentSound();
      if (currentSound && currentSound.playing()) {
        console.log('🔧, 强制暂停音频以符合用户意图');
        currentSound.pause();
      }
    }
    clearInterval();
    interval = window.setInterval(() => {
      try {
        const currentSound = sound.value;
        if (!currentSound) {
          console.error('Invalid sound object: sound is null or, undefined');
          clearInterval();
          return;
        }

        // 确保 seek 方法存在且可调用
        if (typeof currentSound.seek !== 'function') {
          console.error('Invalid sound object: seek function not, available');
          clearInterval();
          return;
        }

        const currentTime = currentSound.seek() as number;
        if (typeof currentTime !== 'number' || Number.isNaN(currentTime)) {
          console.error('Invalid current time:', currentTime);
          clearInterval();
          return;
        }

        nowTime.value = currentTime;
        allTime.value = currentSound.duration() as number;
        const newIndex = getLrcIndex(nowTime.value);
        if (newIndex !== nowIndex.value) {
          nowIndex.value = newIndex;
          // 注意：我们不在这里设置 currentLrcProgress 为 0
          // 因为这会与全局进度更新冲突
          if (isElectron && isLyricWindowOpen.value) {
            sendLyricToWin();
          }
        }
        if (isElectron && isLyricWindowOpen.value) {
          sendLyricToWin();
        }
      } catch (error) {
        console.error('Error in interval:', error);
        clearInterval();
      }
    }, 50);
  });

  // 监听暂停
  audioService.on('pause', () => {
    console.log('音频暂停事件触发');
    getPlayerStore().setPlayMusic(false);
    clearInterval();
    if (isElectron && isLyricWindowOpen.value) {
      sendLyricToWin();
    }
  });

  const replayMusic = async () => {
    try {
      // 如果当前有音频实例，先停止并销毁
      if (sound.value) {
        sound.value.stop();
        sound.value.unload();
        sound.value = null;
      }

      // 重新播放当前歌曲
      if (getPlayerStore().playMusicUrl && playMusic.value) {
        const newSound = await audioService.play(getPlayerStore().playMusicUrl);
        sound.value = newSound as Howl;
        setupAudioListeners();
      } else {
        console.error('No music URL or playMusic data, available');
        getPlayerStore().nextPlay();
      }
    } catch (error) {
      console.error('Error replaying song:', error);
      getPlayerStore().nextPlay();
    }
  };

  // 监听结束
  audioService.on('end', () => {
    console.log('音频播放结束事件触发');
    clearInterval();

    if (getPlayerStore().playMode === 1) {
      // 单曲循环模式
      if (sound.value) {
        replayMusic();
      }
    } else if (getPlayerStore().playMode === 2) {
      // 随机播放模式

      if (getPlayerStore().playList.length <= 1) {
        replayMusic();
      } else {
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * getPlayerStore().playList.length);
        } while (
          randomIndex === getPlayerStore().playListIndex &&
          getPlayerStore().playList.length > 1
        );
        getPlayerStore().playListIndex = randomIndex;
        getPlayerStore().setPlay(getPlayerStore().playList[randomIndex]);
      }
    } else {
      // 列表循环模式
      getPlayerStore().nextPlay();
    }
  });

  audioService.on('previoustrack', () => {
    getPlayerStore().prevPlay();
  });

  audioService.on('nexttrack', () => {
    getPlayerStore().nextPlay();
  });

  return clearInterval;
};

export const play = () => {
  audioService.getCurrentSound()?.play();
};

export const pause = () => {
  const currentSound = audioService.getCurrentSound();
  if (currentSound) {
    try {
      // 保存当前播放进度
      const currentTime = currentSound.seek() as number;
      if (getPlayerStore().playMusic && getPlayerStore().playMusic.id) {
        localStorage.setItem(
          'playProgress',
          JSON.stringify({
            songId: getPlayerStore().playMusic.id,
            progress: currentTime
          })
        );
      }

      audioService.pause();
    } catch (error) {
      console.error('暂停播放出错:', error);
    }
  }
};

// 歌词矫正时间映射（每首歌独立）
const CORRECTION_KEY = 'lyric-correction-map';
const correctionTimeMap = ref<Record<string, number>>({});

// 初始化 correctionTimeMap
const loadCorrectionMap = () => {
  try {
    const raw = localStorage.getItem(CORRECTION_KEY);
    correctionTimeMap.value = raw ? JSON.parse(raw) : {};
  } catch {
    correctionTimeMap.value = {};
  }
};
const saveCorrectionMap = () => {
  localStorage.setItem(CORRECTION_KEY, JSON.stringify(correctionTimeMap.value));
};

loadCorrectionMap();

// 歌词矫正时间，当前歌曲
export const correctionTime = ref(0);

// 设置歌词矫正时间的监听器
const setupCorrectionTimeWatcher = () => {
  // 切歌时自动读取矫正时间
  const stopCorrectionTimeWatch = watch(
    () => playMusic.value?.id,
    (id) => {
      if (!id) return;
      correctionTime.value = correctionTimeMap.value[id] ?? 0;
    },
    { immediate: true }
  );
  watchStopFunctions.push(stopCorrectionTimeWatch);
};

/**
 * 调整歌词矫正时间（每首歌独立）
 * @param delta 增加/减少的秒数（正为加，负为减）
 */
export const adjustCorrectionTime = (delta: number) => {
  const id = playMusic.value?.id;
  if (!id) return;
  const newVal = Math.max(-10, Math.min(10, (correctionTime.value ?? 0) + delta));
  correctionTime.value = newVal;
  correctionTimeMap.value[id] = newVal;
  saveCorrectionMap();
};

// 获取当前播放歌词
export const isCurrentLrc = (index: number, time: number): boolean => {
  // 添加边界检查防止数组越界
  if (index < 0 || index >= lrcTimeArray.value.length) {
    return false;
  }

  const currentTime = lrcTimeArray.value[index];
  const nextTime = lrcTimeArray.value[index + 1] || currentTime + 1; // 如果是最后一行，使用默认值
  const correctedTime = time + correctionTime.value;
  return correctedTime > currentTime && correctedTime < nextTime;
};

// 获取当前播放歌词INDEX
export const getLrcIndex = (time: number): number => {
  const correctedTime = time + correctionTime.value;
  for (let i = 0; i < lrcTimeArray.value.length; i++) {
    if (isCurrentLrc(i, correctedTime - correctionTime.value)) {
      nowIndex.value = i;
      return i;
    }
  }
  return nowIndex.value;
};

// 获取当前播放歌词进度
const currentLrcTiming = computed(() => {
  const start = lrcTimeArray.value[nowIndex.value] || 0;
  const end = lrcTimeArray.value[nowIndex.value + 1] || start + 1;
  return { start, end };
});

// 获取歌词样式
export const getLrcStyle = (index: number) => {
  // 添加边界检查防止数组越界
  if (index < 0 || index >= lrcTimeArray.value.length) {
    return {};
  }

  const currentTime = nowTime.value + correctionTime.value;
  const start = lrcTimeArray.value[index];
  const end = lrcTimeArray.value[index + 1] ?? start + 1;

  if (currentTime >= start && currentTime < end) {
    // 当前句，显示进度
    const progress = ((currentTime - start) / (end - start)) * 100;
    return {
      backgroundImage: `linear-gradient(to right, #ffffff ${progress}%, #ffffff8a ${progress}%)`,
      _backgroundClip: 'text',
      _WebkitBackgroundClip: 'text',
      _color: 'transparent',
      _transition: 'background-image 0.1s linear'
    };
  }
  // 其它句
  return {};
};

// 播放进度
export const useLyricProgress = () => {
  // 如果已经在全局更新进度，立即返回
  return {
    getLrcStyle
  };
};

// 设置当前播放时间
export const setAudioTime = (index: number) => {
  const currentSound = sound.value;
  if (!currentSound) return;

  currentSound.seek(lrcTimeArray.value[index]);
  currentSound.play();
};

// 获取当前播放的歌词
export const getCurrentLrc = () => {
  const index = getLrcIndex(nowTime.value);
  return {
    currentLrc: lrcArray.value[index],
    nextLrc: lrcArray.value[index + 1]
  };
};

// 获取一句歌词播放时间几秒到几秒
export const getLrcTimeRange = (index: number) => {
  // 添加边界检查防止数组越界
  if (index < 0 || index >= lrcTimeArray.value.length) {
    return { currentTime: 0, nextTime: 0 };
  }

  return {
    currentTime: lrcTimeArray.value[index],
    nextTime: lrcTimeArray.value[index + 1] || lrcTimeArray.value[index] + 1
  };
};

// 监听歌词数组变化，当切换歌曲时重新初始化歌词窗口
const stopLrcArrayWatch = watch(
  () => lrcArray.value,
  (newLrcArray) => {
    if (newLrcArray.length > 0 && isElectron && isLyricWindowOpen.value) {
      sendLyricToWin();
    }
  }
);
watchStopFunctions.push(stopLrcArrayWatch);

// 发送歌词更新数据
export const sendLyricToWin = () => {
  if (!isElectron || !isLyricWindowOpen.value) {
    return;
  }

  // 检查是否有播放的歌曲
  if (!playMusic.value || !playMusic.value.id) {
    return;
  }

  try {
    // 记录歌词发送状态
    if (lrcArray.value && lrcArray.value.length > 0) {
      const nowIndex = getLrcIndex(nowTime.value);
      // 构建完整的歌词更新数据
      const updateData = {
        type: 'full',
        nowIndex,
        nowTime: nowTime.value,
        startCurrentTime: lrcTimeArray.value[nowIndex] || 0,
        nextTime: lrcTimeArray.value[nowIndex + 1] || 0,
        isPlay: getPlayerStore().play,
        lrcArray: lrcArray.value,
        lrcTimeArray: lrcTimeArray.value,
        allTime: allTime.value,
        playMusic: playMusic.value
      };

      // 发送数据到歌词窗口
      window.api.sendLyric(JSON.stringify(updateData));
    } else {
      console.log('No lyric data available, sending empty lyric _message');

      // 发送没有歌词的提示
      const emptyLyricData = {
        type: 'empty',
        nowIndex: 0,
        nowTime: nowTime.value,
        startCurrentTime: 0,
        nextTime: 0,
        isPlay: getPlayerStore().play,
        lrcArray: [{ text: '当前歌曲暂无歌词', trText: '' }],
        lrcTimeArray: [],
        allTime: allTime.value,
        playMusic: playMusic.value
      };
      window.api.sendLyric(JSON.stringify(emptyLyricData));
    }
  } catch (error) {
    console.error('Error sending lyric update:', error);
  }
};

// 歌词同步定时器
let lyricSyncInterval: NodeJS.Timeout | null = null;

// 开始歌词同步
const startLyricSync = () => {
  // 清除已有的定时器
  if (lyricSyncInterval) {
    clearInterval(lyricSyncInterval);
  }

  // 每秒同步一次歌词数据
  lyricSyncInterval = setInterval(() => {
    if (isElectron && isLyricWindowOpen.value && getPlayerStore().play && playMusic.value?.id) {
      // 发送当前播放进度的更新
      try {
        const updateData = {
          type: 'update',
          nowIndex: getLrcIndex(nowTime.value),
          nowTime: nowTime.value,
          isPlay: getPlayerStore().play
        };
        window.api.sendLyric(JSON.stringify(updateData));
      } catch (error) {
        console.error('发送歌词进度更新失败:', error);
      }
    }
  }, 1000);
};

// 停止歌词同步
const stopLyricSync = () => {
  if (lyricSyncInterval) {
    clearInterval(lyricSyncInterval);
    lyricSyncInterval = null;
  }
};

// 修改openLyric函数，添加定时同步
export const openLyric = () => {
  if (!isElectron) return;

  // 检查是否有播放中的歌曲
  if (!playMusic.value || !playMusic.value.id) {
    console.log('没有正在播放的歌曲，无法打开歌词窗口');
    return;
  }

  console.log('Opening lyric window with current song:', playMusic.value?.name);

  isLyricWindowOpen.value = !isLyricWindowOpen.value;
  if (isLyricWindowOpen.value) {
    // 立即打开窗口
    window.api.openLyric();

    // 确保有歌词数据，如果没有，则使用默认的"无歌词"提示
    if (!lrcArray.value || lrcArray.value.length === 0) {
      // 如果当前播放的歌曲有ID但没有歌词，则尝试加载歌词
      console.log('尝试加载歌词数据...');
      // 发送默认的"无歌词"数据
      const emptyLyricData = {
        type: 'empty',
        nowIndex: 0,
        nowTime: nowTime.value,
        startCurrentTime: 0,
        nextTime: 0,
        isPlay: getPlayerStore().play,
        lrcArray: [{ text: '加载歌词中...', trText: '' }],
        lrcTimeArray: [],
        allTime: allTime.value,
        playMusic: playMusic.value
      };
      window.api.sendLyric(JSON.stringify(emptyLyricData));
    } else {
      // 发送完整歌词数据
      sendLyricToWin();
    }

    // 设置定时器，确保500ms后再次发送数据，以防窗口加载延迟
    setTimeout(() => {
      sendLyricToWin();
    }, 500);

    // 启动歌词同步
    startLyricSync();
  } else {
    closeLyric();
    // 停止歌词同步
    stopLyricSync();
  }
};

// 修改closeLyric函数，确保停止定时同步
export const closeLyric = () => {
  if (!isElectron) return;
  isLyricWindowOpen.value = false; // 确保状态更新
  windowData.electron.ipcRenderer.send('close-lyric');

  // 停止歌词同步
  stopLyricSync();
};

// 设置播放状态监听器
const setupPlayStateWatcher = () => {
  // 在组件挂载时设置对播放状态的监听
  const stopPlayStateWatcher = watch(
    () => getPlayerStore().play,
    (isPlaying) => {
      // 如果歌词窗口打开，根据播放状态控制同步
      if (isElectron && isLyricWindowOpen.value) {
        if (isPlaying) {
          startLyricSync();
        } else {
          // 如果暂停播放，发送一次暂停状态的更新
          const pauseData = {
            type: 'update',
            isPlay: false
          };
          window.api.sendLyric(JSON.stringify(pauseData));
        }
      }
    }
  );
  watchStopFunctions.push(stopPlayStateWatcher);
};

// 在组件卸载时清理资源
const instance = getCurrentInstance();
if (instance) {
  onUnmounted(() => {
    stopLyricSync();
  });
}

// 添加播放控制命令监听
if (isElectron) {
  windowData.electron.ipcRenderer.on('lyric-control-back', (_, command: string) => {
    switch (command) {
      case 'playpause':
        console.log('歌词窗口播放/暂停，当前状态:', getPlayerStore().play ? '播放' : '暂停');
        // 使用统一的播放/暂停逻辑
        getPlayerStore().setPlay(getPlayerStore().playMusic);
        break;
      case 'prev':
        getPlayerStore().prevPlay();
        break;
      case 'next':
        getPlayerStore().nextPlay();
        break;
      case 'close':
        isLyricWindowOpen.value = false; // 确保状态更新
        break;
      default:
        console.log('Unknown command:', command);
        break;
    }
  });
}

// 在组件挂载时设置监听器
export const initAudioListeners = async () => {
  try {
    // 确保有正在播放的音乐
    if (!getPlayerStore().playMusic || !getPlayerStore().playMusic.id) {
      console.log('没有正在播放的音乐，跳过音频监听器初始化');
      return;
    }

    // 确保有音频实例
    const initialSound = audioService.getCurrentSound();
    if (!initialSound) {
      console.log('没有音频实例，等待音频加载...');
      // 等待音频加载完成
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          const sound = audioService.getCurrentSound();
          if (sound) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);

        // 设置超时
        setTimeout(() => {
          clearInterval(checkInterval);
          console.log('等待音频加载超时');
          resolve();
        }, 5000);
      });
    }

    // 初始化音频监听器
    setupAudioListeners();

    // 监听歌词窗口关闭事件
    if (isElectron) {
      window.api.onLyricWindowClosed(() => {
        isLyricWindowOpen.value = false;
      });
    }

    // 获取最新的音频实例
    const finalSound = audioService.getCurrentSound();
    if (finalSound) {
      // 更新全局 sound 引用
      sound.value = finalSound;
    } else {
      console.warn('无法获取音频实例，跳过进度更新初始化');
    }
  } catch (error) {
    console.error('初始化音频监听器失败:', error);
  }
};

// 监听URL过期事件，自动重新获取URL并恢复播放
audioService.on('url_expired', async (expiredTrack) => {
  if (!expiredTrack) return;

  console.log('检测到URL过期事件，准备重新获取URL', expiredTrack.name);

  try {
    const currentPosition = nowTime.value; // 保存当前播放进度
    console.log('保存当前播放进度:', currentPosition);

    // 处理网易云音乐
    if (expiredTrack.source === 'netease') {
      // 处理网易云音乐，重新获取URL
      console.log('重新获取网易云音乐URL');
      try {
        const newUrl = await getSongUrl(expiredTrack.id, expiredTrack as unknown as SongResult);

        if (newUrl) {
          console.log('成功获取新的网易云URL:', newUrl);

          // 更新存储
          (expiredTrack as { playMusicUrl?: string }).playMusicUrl = newUrl;
          getPlayerStore().playMusicUrl = newUrl;

          // 重新播放并设置进度
          const newSound = await audioService.play(newUrl, expiredTrack);
          sound.value = newSound as Howl;

          // 恢复播放进度
          if (currentPosition > 0) {
            newSound.seek(currentPosition);
            nowTime.value = currentPosition;
            console.log('恢复播放进度:', currentPosition);
          }

          // 如果之前是播放状态，继续播放
          if (getPlayerStore().play) {
            newSound.play();
            getPlayerStore().setIsPlay(true);
          }

          message.success('已自动恢复播放');
        } else {
          throw new Error('获取URL失败');
        }
      } catch (error) {
        console.error('重新获取网易云URL失败:', error);
        message.error('重新获取音频地址失败，请手动点击播放');
      }
    }
  } catch (error) {
    console.error('处理URL过期事件失败:', error);
    message.error('恢复播放失败，请手动点击播放');
  }
});

// 音频就绪事件处理器
const audioReadyHandler = ((event: CustomEvent) => {
  try {
    // 多层次验证事件数据
    if (!event || !event.detail) {
      console.warn('音频就绪事件数据无效');
      return;
    }

    const { sound: newSound } = event.detail;
    if (!newSound || typeof newSound.seek !== 'function') {
      console.warn('音频对象无效或缺少必要方法');
      return;
    }

    // 更新本地 sound 引用
    sound.value = newSound as Howl;

    // 设置音频监听器
    setupAudioListeners();

    // 安全的位置获取
    try {
      const currentPosition = newSound.seek();
      if (
        typeof currentPosition === 'number' &&
        !Number.isNaN(currentPosition) &&
        currentPosition >= 0
      ) {
        nowTime.value = currentPosition;
      }
    } catch (seekError) {
      console.warn('获取音频位置失败:', seekError);
    }

    console.log('音频就绪，已设置监听器并更新进度显示');
  } catch (error) {
    console.error('处理音频就绪事件出错:', error);
  }
}) as EventListener;

// 添加音频就绪事件监听器
window.addEventListener('audio-ready', audioReadyHandler);

// 清理函数 - 在组件卸载时调用
export const cleanupMusicHook = () => {
  try {
    // 移除全局事件监听器
    window.removeEventListener('audio-ready', audioReadyHandler);

    // 批量异步清理 watch 监听器
    const cleanupWatchers = async () => {
      const batchSize = 10;
      for (let i = 0; i < watchStopFunctions.length; i += batchSize) {
        const batch = watchStopFunctions.slice(i, i + batchSize);

        // 批量处理
        await Promise.allSettled(
          batch.map(
            (stopFn) =>
              new Promise<void>((resolve) => {
                try {
                  stopFn();
                } catch (error) {
                  console.error('清理 watch 监听器失败:', error);
                }
                resolve();
              })
          )
        );

        // 让出控制权，避免阻塞UI
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      watchStopFunctions.length = 0;
    };

    // 执行异步清理
    cleanupWatchers().catch((error) => {
      console.error('批量清理监听器失败:', error);
    });

    // 清理所有定时器和动画帧
    if (globalAnimationFrameId) {
      // globalAnimationFrameId 可能是 requestAnimationFrame 或 setTimeout 的返回值
      // 两者都可以用 clearTimeout 安全清理
      clearTimeout(globalAnimationFrameId);
      globalAnimationFrameId = null;
    }

    // 清理防抖定时器
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    // 清理所有MusicHook定时器
    clearAllMusicHookTimers();

    // 清理歌词同步定时器
    stopLyricSync();

    // 停止进度动画
    stopProgressAnimation();

    // 清理音频服务事件监听器
    audioService.removeAllListeners();

    console.log('MusicHook, 清理完成');
  } catch (error) {
    console.error('MusicHook 清理失败:', error);
  }
};

// 添加页面卸载时的清理
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    stopLyricSync();
  });
}
