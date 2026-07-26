"""
AI推荐系统
基于内容相似度的智能推荐
"""

import logging

logger = logging.getLogger(__name__)
# ！！明天搞定热门功能，今晚搞定搜索功能

class Recommender:
    """推荐系统"""
    
    def __init__(self):
        """初始化推荐系统"""
        self.video_library = self._init_video_library()
        logger.info(f"推荐系统初始化完成，共{len(self.video_library)}个视频")
    
    def _init_video_library(self):
         """初始化视频库"""
         return []
    def update_library(self, videos):
        """从外部更新视频库"""
        # 格式化数据
        for v in videos:
            v['view_count'] = self._format_views(v.get('view_count', 0))
            v['tags'] = v.get('tags', '其他')
            v['zuopin_name']=v.get('zuopin_name','未知作品')
        self.video_library = videos
        logger.info(f"视频库已更新，共{len(videos)}个视频")

    def _format_views(self, count):
        if count >= 10000:
            return f"{count/10000:.1f}w"
        return str(count)    
    
    def recommend(self, query, top_k=10):
        """
        根据查询推荐内容
        
        参数:
            query: 用户查询关键词
            top_k: 返回数量
        
        返回:
            list: 推荐列表
        """
        if not self.video_library:
         logger.warning("视频库为空，无法推荐")
         return []
        if not query or query == '热门推荐':
            return self._get_hot_recommendations(top_k)
        
        # 计算每个视频的相关性分数
        scored_videos = []
        query_lower = query.lower()
        
        for video in self.video_library:
            score = self._calculate_score(video, query_lower)
            scored_videos.append({**video, 'score': score})
        
        # 按分数排序
        scored_videos.sort(key=lambda x: x['score'], reverse=True)#lambda临时小函数
        
        return scored_videos[:top_k]
    
    def _calculate_score(self, video, query_lower):
        """
        计算视频与查询的相关性分数
        """
        score = 0.3  # 基础分
        
        # 标题匹配（权重高）
        if query_lower in video['zuopin_name'].lower():
            score += 0.4
        elif any(word in video['zuopin_name'].lower() for word in query_lower.split()):
            score += 0.2
        
        # 标签匹配
        tags = video.get('tags', '')
        if tags is None:
           tags = ''
        if isinstance(tags, str):
           tags = [t.strip() for t in tags.split(',') if t.strip()]
        for tag in tags:
            if tag.lower() in query_lower or query_lower in tag.lower():
              score += 0.25
              break
        
        # 分类匹配
        username = video.get('username', '')
        if username and username.lower() in query_lower:
            score += 0.15
        
        # 浏览量加成（热门内容）///加数据库动态更新浏览量功能
        views_str = video['view_count'].replace('w', '0000').replace('.', '')
        try:
            views = int(views_str)
            if views > 1000:
                score += 0.1
            elif views > 500:
                score += 0.05
        except:
            pass
        
        return min(1, score)
    
    def _get_hot_recommendations(self, top_k):
        """获取热门推荐（按浏览量排序）"""
        scored_videos = []
        for video in self.video_library:
            views_str = video['view_count'].replace('w', '0000').replace('.', '')#.replace替换内容
            try:
                views = int(views_str)
                score = min(0.99, views / 100000)
            except:
                score = 0.5
            scored_videos.append({**video, 'score': score})
        
        scored_videos.sort(key=lambda x: x['score'], reverse=True)
        return scored_videos[:top_k]
    
    def get_video_detail(self, video_id):
        """获取视频详情"""
        for video in self.video_library:
            if video['id'] == video_id:
                return video
        return None


# class MockRecommender:
#     """模拟推荐器"""
    
#     def recommend(self, query, top_k=5):
#         return [
#             {'title': f'【推荐{query}】视频{i}', 'score': 0.9 - i*0.05, 'tags': ['推荐'], 'duration': '5:00', 'views': '1000'}
#             for i in range(top_k)
#         ]