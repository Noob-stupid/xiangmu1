"""
校园文化创意展示站 - 创意内容审核模型
评估视频的创意性、技术性、主题契合度
"""

import random
import logging

logger = logging.getLogger(__name__)


# class VideoAuditor:
#     """校园创意内容审核器"""
    
#     def __init__(self):
#         """初始化审核器"""
#         # 校园文化主题关键词
#         self.campus_themes = [
#             '校园生活', '社团活动', '文艺表演', '体育竞赛', 
#             '学习日常', '毕业季', '迎新', '校庆', '志愿服务',
#             '创意短片', '舞蹈', '音乐', '绘画', '摄影'
#         ]
        
#         # 创意类型标签库
#         self.content_types = {
#             '舞蹈类': ['舞蹈', '街舞', '民族舞', '现代舞', 'kpop', '宅舞'],
#             '音乐类': ['唱歌', '乐器', '弹唱', '乐队', '原创音乐', '翻唱'],
#             '影视类': ['短剧', '微电影', '剧情', '搞笑', '情景剧'],
#             '美术类': ['绘画', '设计', '手工', '书法', '摄影', '插画'],
#             '记录类': ['vlog', '校园日常', '纪录片', '采访', '活动记录'],
#             '技术类': ['动画', '特效', '编程', 'AI创作', '数字艺术'],
#             '运动类': ['篮球', '足球', '跑步', '健身', '滑板', '舞蹈运动']
#         }
        
#         logger.info("校园创意内容审核器初始化完成")
    
#     def audit_video(self, frames, filename):
#         """
#         审核视频创意内容
        
#         返回:
#             passed: 是否通过审核（创意内容是否适合展示）
#             score: 综合评分 0-100
#             content_type: 内容类型
#             tags: 内容标签
#             suggestions: 改进建议
#             message: 审核意见
#         """
#         filename_lower = filename.lower()
        
#         # 1. 识别内容类型
#         content_type, tags = self._identify_content_type(filename_lower)
        
#         # 2. 评估创意质量（模拟AI分析）
#         quality_score = self._evaluate_quality(frames, filename_lower)
        
#         # 3. 评估主题契合度
#         theme_score = self._evaluate_theme_relevance(filename_lower)
        
#         # 4. 计算综合得分
#         total_score = (quality_score * 0.3 + theme_score * 0.7)
        
#         # 5. 生成审核意见和建议
#         passed = total_score >= 60
#         message = self._generate_message(passed, total_score, content_type)
#         suggestions = self._generate_suggestions(total_score, content_type)
        
#         # 6. 生成帧分析详情
#         frame_details = self._generate_frame_details(frames, total_score)
        
#         return {
#             'passed': passed,
#             'score': round(total_score, 1),
#             'content_type': content_type,
#             'tags': tags[:5],  # 最多5个标签
#             'suggestions': suggestions,
#             'message': message,
#             'frames_analyzed': len(frames),#分析的帧数量
#             'frame_details': frame_details,
#             'quality_score': round(quality_score, 1),
#             'theme_score': round(theme_score, 1)
#         }
    
#     def _identify_content_type(self, filename):
#         """识别内容类型"""
#         detected_type = '创意短片'
#         detected_tags = []
        
#         for ctype, keywords in self.content_types.items():
#             for kw in keywords:
#                 if kw.lower() in filename:#在文件名里找标签
#                     detected_type = ctype
#                     detected_tags.append(kw.lower())
        
#         # 如果没有匹配到，默认加几个标签
#         if not detected_tags:
#             detected_tags = ['创意', '校园']
        
#         # 随机添加一些校园主题标签（模拟）
#         ''' campus_tags = ['校园生活', '青春', '创意', '精彩']
#         random.shuffle(campus_tags)#shuffle:洗牌，打乱顺序
#         detected_tags.extend(campus_tags[:2])'''#extend是把列表里的元素加入
        
#         return detected_type, list(set(detected_tags))#先变集合去重再变列表
    
#     def _evaluate_quality(self, frames, filename):
#         """评估创意质量"""
#         if not frames:
#             return 20
        
#         # 模拟质量评估（实际可接入真实AI模型）
#         # 这里根据帧数和文件名关键词模拟评分
        
#         base_score = 50
        
#         # 帧数越多，内容越丰富
#         if len(frames) > 20:
#             base_score += 10
#         elif len(frames) > 10:
#             base_score += 5
        
#         # 文件名包含创意关键词加分
#         creative_keywords = ['创意', '原创', '精彩', '优秀', '大赛', '作品',
#                              'creative', 'original', 'campus', 'video', 'good', 'best']
#         for kw in creative_keywords:
#             if kw in filename:
#                 base_score += 5  # 固定加5分，不加随机
    
#         # 限制分数范围（最低15分，最高95分）
#         base_score += random.randint(-5, 10)
#         final_score = min(95, max(35, base_score))
    
#         return final_score
    
#     def _evaluate_theme_relevance(self, filename):
#        """评估主题契合度（修复版）"""
#        # 基础分提高
#        score = 50
#        filename_lower = filename.lower()
#        # 加入英文关键词，让文件名能匹配到
#        campus_keywords = [
#            '校园', '大学', '青春', '毕业', '迎新', '社团', '活动',
#            'campus', 'school', 'college', 'student', 'youth', 'club', 'sport'
#             ]
    
#        matched = False
#        for kw in campus_keywords:
#             if kw in filename_lower:
#                 score += 8
#                 matched = True
#        # 不强制给15分！没有匹配也给基础分
#        if not matched:
#            score = 40  # 保底分
    
#        # 随机浮动
    
#        score += random.randint(-5, 8)
#        return min(95, max(40, score))
    
#     def _generate_message(self, passed, score, content_type):
#         """生成审核意见"""
#         if passed:
#             if score >= 85:
#                 return f'🎉 优秀作品！{content_type}创意十足，内容积极向上，推荐首页展示！'
#             elif score >= 70:
#                 return f'✨ 良好作品！{content_type}内容精彩，符合校园文化主题，通过审核。'
#             else:
#                 return f'📌 通过审核！{content_type}内容健康，建议稍作优化后可获得更好展示效果。'
#         else:
#             if score >= 50:
#                 return f'📝 待改进：{content_type}内容基础良好，建议增强创意性，修改后可重新提交。'
#             else:
#                 return f'💡 建议修改：当前内容与校园文化主题契合度较低，建议增加校园元素或创意亮点。'
    
#     def _generate_suggestions(self, score, content_type):
#         """生成改进建议"""
#         suggestions = []
        
#         if score < 70:
#             suggestions.append('🎨 建议增加更多创意元素')
#         if score < 60:
#             suggestions.append('📚 内容可更贴近校园生活主题')
#         if score < 80 and '舞蹈' in content_type:
#             suggestions.append('💃 舞蹈类作品可增加队形变化和创意编排')
#         if score < 80 and '音乐' in content_type:
#             suggestions.append('🎵 音乐类作品可尝试原创或改编')
#         if score < 80 and '影视' in content_type:
#             suggestions.append('🎬 影视类作品可加强剧情设计和拍摄手法')
#         if score < 80 and '美术' in content_type:
#             suggestions.append('🎨 美术类作品可尝试更多创作形式')
        
#         if not suggestions:
#             suggestions.append('🌟 作品很棒！继续保持创意热情')
#             suggestions.append('🏆 可考虑参加校园创意大赛')
        
#         return suggestions
    
#     def _generate_frame_details(self, frames, total_score):
#         """生成帧分析详情"""
#         frame_details = []
        
#         for i in range(min(len(frames), 8)):
#             # 根据总分数模拟各帧表现
#             if total_score >= 85:
#                 status = 'excellent'
#                 analysis = f'第{i+1}帧：画面精美，构图出色 ✨'
#             elif total_score >= 70:
#                 status = 'good'
#                 analysis = f'第{i+1}帧：内容清晰，表达明确 👍'
#             elif total_score >= 60:
#                 status = 'normal'
#                 analysis = f'第{i+1}帧：内容合格，有提升空间 📌'
#             else:
#                 status = 'warning'
#                 analysis = f'第{i+1}帧：建议增强创意性或画面表现力 💡'
            
#             frame_details.append({
#                 'frame': i + 1,
#                 'analysis': analysis,
#                 'status': status
#             })
        
#         return frame_details
"""
校园文化创意展示站 - 创意内容审核模型
"""

import logging
from .vision_auditor import VideoContentAuditor
logger = logging.getLogger(__name__)


class VideoAuditor:
    """校园创意内容审核器"""
    
    def __init__(self):
        """初始化审核器"""
        # 初始化综合视频内容审核器
        self.content_auditor = VideoContentAuditor()
        logger.info("视频审核器初始化完成")
    
    def audit_video(self, frames, filename):
        """
        审核视频创意内容
        
        返回:
            passed: 是否通过审核
            score: 综合评分 0-100
            content_type: 内容类型
            tags: 内容标签
            suggestions: 改进建议
            message: 审核意见
        """
        # 调用综合审核器
        result = self.content_auditor.audit_video(frames, filename)
        return result