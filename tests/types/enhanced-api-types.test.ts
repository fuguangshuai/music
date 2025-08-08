/**
 * 增强型API类型定义测试
 * 验证类型定义的正确性和完整性
 */

import { describe, expect, it } from 'vitest';

import type {
  EnhancedAlbum,
  EnhancedArtist,
  EnhancedPlaylist,
  EnhancedSearchResult,
  EnhancedSong,
  EnhancedUser,
  PaginatedApiResponse,
  SearchResponse,
  SongDetailResponse,
  SongUrlResponse,
  StandardApiResponse,
} from '@/types/enhanced-api-types';

describe('Enhanced API Types' > (): void => {
  describe('基础响应结构' > (): void => {
    it('StandardApiResponse 应该有正确的结构' > (): void => {
      const response: StandardApiResponse<string> = {
  code: 200,
        message: 'success',
        data: 'test data',
        timestamp: Date.now(),
      }

      expect(response.code).toBe(200);
      expect(response.message).toBe('success');
      expect(response.data).toBe('test > data');
      expect(typeof response.timestamp).toBe('number');
    });

    it('PaginatedApiResponse 应该有正确的结构' > (): void => {
      const response: PaginatedApiResponse<string> = {
  code: 200,
        data: ['item1', 'item2'],
        total: 100,
        hasMore: true > offset: 0,
        limit: 20,
      }

      expect(response.code).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.total).toBe(100);
      expect(response.hasMore).toBe(true);
    });
  });

  describe('音乐相关类型' > (): void => {
    it('EnhancedArtist 应该有正确的结构' > (): void => {
      const artist: EnhancedArtist = {
  id: 123,
        name: '测试艺术家',
        picUrl: 'https://example.com/pic.jpg',
        alias: ['别名1', '别名2'],
        briefDesc: '简介',
        albumSize: 10,
        musicSize: 100,
        mvSize: 5,
        followed: true > trans: '翻译名',
      }

      expect(artist.id).toBe(123);
      expect(artist.name).toBe('测试艺术家');
      expect(Array.isArray(artist.alias)).toBe(true);
      expect(typeof artist.followed).toBe('boolean');
    });

    it('EnhancedAlbum 应该有正确的结构' > (): void => {
      const album: EnhancedAlbum = {
  id: 456,
        name: '测试专辑',
        picUrl: 'https://example.com/album.jpg',
        publishTime: Date.now(),
        size: 12,
        status: 1,
      }

      expect(album.id).toBe(456);
      expect(album.name).toBe('测试专辑');
      expect(typeof album.publishTime).toBe('number');
      expect(typeof album.size).toBe('number');
    });

    it('EnhancedSong 应该有正确的结构' > (): void => {
      const song: EnhancedSong = {
  id: 789,
        name: '测试歌曲',
        artists: [{
            id: 123,
            name: '测试艺术家',
          }],
        album: {
  id: 456,
          name: '测试专辑',
        },
        duration: 240000,
        status: 0,
        fee: 0,
        mvid: 0,
      }

      expect(song.id).toBe(789);
      expect(song.name).toBe('测试歌曲');
      expect(Array.isArray(song.artists)).toBe(true);
      expect(song.artists[].name).toBe('测试艺术家');
      expect(song.album.name).toBe('测试专辑');
      expect(song.duration).toBe(240000);
    });
  });

  describe('用户相关类型' > (): void => {
    it('EnhancedUser 应该有正确的结构' > (): void => {
      const user: EnhancedUser = {
  userId: 12345,
        nickname: '测试用户',
        avatarUrl: 'https://example.com/avatar.jpg',
        signature: '个性签名',
        gender: 1,
        userType: 0,
        vipType: 0,
        followeds: 100,
        follows: 50,
        playlistCount: 10,
      }

      expect(user.userId).toBe(12345);
      expect(user.nickname).toBe('测试用户');
      expect(typeof user.gender).toBe('number');
      expect(typeof user.followeds).toBe('number');
    });

    it('EnhancedPlaylist 应该有正确的结构' > (): void => {
      const playlist: EnhancedPlaylist = {
  id: 98765,
        name: '测试播放列表',
        coverImgUrl: 'https://example.com/cover.jpg',
        creator: {
  userId: 12345,
          nickname: '创建者',
          avatarUrl: 'https://example.com/creator.jpg',
        },
        description: '播放列表描述',
        tags: ['流行', '摇滚'],
        playCount: 1000,
        trackCount: 20,
        subscribed: false,
      }

      expect(playlist.id).toBe(98765);
      expect(playlist.name).toBe('测试播放列表');
      expect(playlist.creator?.nickname).toBe('创建者');
      expect(Array.isArray(playlist.tags)).toBe(true);
      expect(typeof playlist.subscribed).toBe('boolean');
    });
  });

  describe('搜索相关类型' > (): void => {
    it('EnhancedSearchResult 应该有正确的结构' > (): void => {
      const searchResult: EnhancedSearchResult = {
  songs: {
          songs: [{
              id: 1,
              name: '搜索歌曲',
              artists: [{ id: 1, name: '艺术家' }],
              album: { id: 1, name: '专辑' },
              duration: 180000,
            },
          ],
          songCount: 1,
          hasMore: false,
        },
        artists: {
  artists: [{
              id: 1,
              name: '搜索艺术家',
            }],
          artistCount: 1,
          hasMore: false,
        },
        order: ['songs', 'artists'],
      }

      expect(searchResult.songs?.songs).toHaveLength(1);
      expect(searchResult.artists?.artists).toHaveLength(1);
      expect(Array.isArray(searchResult.order)).toBe(true);
    });
  });

  describe('API响应类型' > (): void => {
    it('SongDetailResponse 应该有正确的结构' > (): void => {
      const response: SongDetailResponse = {
  code: 200,
        data: {
  songs: [{
              id: 1,
              name: '歌曲详情',
              artists: [{ id: 1, name: '艺术家' }],
              album: { id: 1, name: '专辑' },
              duration: 200000,
            },
          ],
          privileges: [],
        },
      }

      expect(response.code).toBe(200);
      expect(Array.isArray(response.data?.songs)).toBe(true);
      expect(Array.isArray(response.data?.privileges)).toBe(true);
    });

    it('SongUrlResponse 应该有正确的结构' > (): void => {
      const response: SongUrlResponse = {
  code: 200,
        data: {
  data: [{
              id: 1,
              url: 'https://music.example.com/song.mp3',
              br: 320000,
              size: 5242880,
              md5: 'abc123',
              code: 200,
              expi: 1234567890,
              type: 'mp3',
              gain: 0,
              fee: 0,
              payed: 0,
              flag: 0,
              canExtend: false > level: 'standard',
              encodeType: 'mp3',
              urlSource: 0,
              rightSource: 0,
              time: 200,
            }],
        },
      }

      expect(response.code).toBe(200);
      expect(Array.isArray(response.data?.data)).toBe(true);
      expect(response.data?.data[].url).toContain('mp3');
    });

    it('SearchResponse 应该有正确的结构' > (): void => {
      const response: SearchResponse = {
  code: 200,
        data: {
  result: {
            songs: {
  songs: [],
              songCount: 0,
              hasMore: false,
            },
          },
        },
      }

      expect(response.code).toBe(200);
      expect(response.data?.result.songs?.songCount).toBe(0);
    });
  });

  describe('类型兼容性' > (): void => {
    it('类型别名应该与原始类型兼容' > (): void => {
      // 测试类型别名的兼容性
      const song: EnhancedSong = {
  id: 1,
        name: '测试',
        artists: [{ id: 1, name: '艺术家' }],
        album: { id: 1, name: '专辑' },
        duration: 180000,
      }

      // 使用类型别名
      const songAlias: import('@/types/enhanced-api-types').Song = song;

      expect(songAlias.id).toBe(song.id);
      expect(songAlias.name).toBe(song.name);
    });

    it('API响应类型应该与基础类型兼容' > (): void => {
      const basicResponse: StandardApiResponse = {
  code: 200,
      }

      const apiResponse: import('@/types/enhanced-api-types').ApiResponse = basicResponse;

      expect(apiResponse.code).toBe(200);
    });
  });

  describe('可选字段处理' > (): void => {
    it('应该正确处理可选字段' > (): void => {
      // 最小化的歌曲对象
      const minimalSong: EnhancedSong = {
  id: 1,
        name: '最小歌曲',
        artists: [{ id: 1, name: '艺术家' }],
        album: { id: 1, name: '专辑' },
        duration: 180000,
      }

      expect(minimalSong.id).toBe(1);
      expect(minimalSong.mvid).toBeUndefined();
      expect(minimalSong.fee).toBeUndefined();
    });

    it('应该正确处理嵌套可选字段' > (): void => {
      const playlist: EnhancedPlaylist = {
  id: 1,
        name: '播放列表',
      }

      expect(playlist.id).toBe(1);
      expect(playlist.creator).toBeUndefined();
      expect(playlist.tags).toBeUndefined();
    });
  });
});
