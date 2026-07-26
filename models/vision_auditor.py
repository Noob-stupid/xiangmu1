"""
视频内容审核器 - 综合版
功能：CLIP画面识别 + OCR文字识别
"""

import logging
import cv2
import numpy as np
from PIL import Image
from typing import List, Dict, Tuple, Optional

logger = logging.getLogger(__name__)

# 尝试导入CLIP
try:
    import torch
    import clip
    
    CLIP_AVAILABLE = True
    logger.info("✅ CLIP 可用")
except ImportError:
    CLIP_AVAILABLE = False
    logger.warning("⚠️ CLIP 未安装，画面识别功能不可用")

# 尝试导入EasyOCR
try:
    import easyocr
    
    OCR_AVAILABLE = True
    logger.info("✅ EasyOCR 可用")
except ImportError:
    OCR_AVAILABLE = False
    logger.warning("⚠️ EasyOCR 未安装，文字识别功能不可用")


class VideoContentAuditor:
    """视频内容审核器（CLIP画面 + OCR文字）"""
    
    def __init__(self):
        """初始化所有模型"""
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.clip_model = None
        self.clip_preprocess = None
        self.ocr_reader = None
        
        # 初始化CLIP
        if CLIP_AVAILABLE:
            try:
                self.clip_model, self.clip_preprocess = clip.load("ViT-B/32", device=self.device)
                logger.info(f"✅ CLIP模型加载成功，设备: {self.device}")
            except Exception as e:
                logger.error(f"CLIP加载失败: {e}")
        
        # 初始化OCR
        if OCR_AVAILABLE:
            try:
                self.ocr_reader = easyocr.Reader(['ch_sim', 'en'], gpu=False, verbose=False)
                logger.info("✅ OCR模型加载成功")
            except Exception as e:
                logger.error(f"OCR加载失败: {e}")
        
        # 校园相关描述词（CLIP用）
        self.campus_descriptions = [
            # 场景
            "campus", "school", "university", "classroom", "playground", 
            "library", "dormitory", "canteen", "操场", "教室", "图书馆",
            # 活动
            "graduation ceremony", "sports meet", "dance performance",
            "singing competition", "club activity", "毕业典礼", "运动会", "舞蹈",
            # 人物
            "students", "young people", "youth", "学生", "青春",
            # 创意
            "creative video", "art performance", "short film", "创意视频"
        ]
        
        # 校园关键词（OCR用）
        self.campus_keywords = [
            '校园', '大学', '青春', '毕业', '迎新', '社团', '活动', 
            '比赛', '文艺', '体育', '运动会', '舞蹈', '歌唱', '表演',
            '教室', '操场', '图书馆', '学生', '老师', '校庆'
        ]
        
        logger.info("视频内容审核器初始化完成")
    
        self.violation_keywords = [
        # 色情相关
        '色情', '黄色', '裸体', '裸照', '性爱', '淫秽', '成人', '18禁',
        'porn', 'sex', 'nude', 'xxx', 'adult', 'erotic', 'nsfw',
        # 暴力相关
        '暴力', '血腥', '杀人', '打架', '恐怖', '虐待', '残忍',
        'violence', 'blood', 'kill', 'attack', 'horror', 'gore',
        # 政治敏感
        '反动', '敏感', '政治', '法轮功', '台独', '藏独',
        # 违法相关
        '毒品', '赌博', '诈骗', '枪支', '炸药'
    ]
    
        self.violation_descriptions = [
        "pornography", "nudity", "sexual content", "adult video",
        "violence", "blood", "gore", "weapon", "fighting", "horror"
    ]
    
        logger.info("视频内容审核器初始化完成（含违规检测）")
    
    def audit_video(self, frames: List, filename: str = "") -> Dict:
        """
        综合审核视频
        
        返回:
            passed: 是否通过
            score: 综合得分 0-100
            content_type: 内容类型
            tags: 标签
            message: 审核意见
            suggestions: 改进建议
        """
        if not frames:
            return self._get_default_result("无法分析视频内容", 20)
        # ========== ✅ 先做违规检测 ==========
        violation_result = self._check_violations(frames, filename)
    
        if violation_result['has_violation']:
           logger.warning(f"检测到违规内容: {violation_result['reason']}")
           return {
            'passed': False,
            'score': 0,
            'content_type': '违规内容',
            'tags': [],
            'suggestions': ['内容违规，请修改后重新上传'],
            'message': f"❌ 审核不通过！检测到违规内容：{violation_result['reason']}",
            'frames_analyzed': len(frames),
            'frame_details': [],
            'clip_score': 0,
            'ocr_score': 0,
            'violations': violation_result['details']
               }
        
        # 1. CLIP画面识别
        clip_result = self._analyze_with_clip(frames) if CLIP_AVAILABLE else {'score': 50, 'matches': []}
        
        # 2. OCR文字识别
        ocr_result = self._analyze_with_ocr(frames) if OCR_AVAILABLE else {'score': 30, 'texts': [], 'keywords': []}
        
        # 3. 文件名分析
        name_result = self._analyze_filename(filename)
        
        # 4. 综合评分
        total_score = (
            clip_result['score'] * 0.7 +
            ocr_result['score'] * 0.2 +
            name_result['score'] * 0.1
        )
        quality_score = clip_result['score']# 创意分用CLIP画面分
        theme_score = (
        ocr_result['score'] * 0.6 +
        name_result['score'] * 0.4
        )
        # 5. 识别内容类型
        content_type = self._identify_content_type(clip_result, ocr_result, filename)
        
        # 6. 生成标签
        tags = self._generate_tags(clip_result, ocr_result, name_result)
        
        # 7. 生成意见和建议
        passed = total_score >= 55
        message = self._generate_message(passed, total_score, content_type, clip_result, ocr_result)
        suggestions = self._generate_suggestions(total_score, content_type, clip_result, ocr_result)
        
        # 8. 帧分析详情
        frame_details = self._generate_frame_details(frames, total_score, clip_result, ocr_result)
        
        return {
            'passed': passed,
            'score': round(total_score, 1),
            'content_type': content_type,
            'tags': tags[:5],
            'suggestions': suggestions,
            'message': message,
            'frames_analyzed': len(frames),
            'frame_details': frame_details,
            'clip_score': round(clip_result['score'], 1),
            'ocr_score': round(ocr_result['score'], 1),
            'matched_scenes': clip_result.get('matches', [])[:3],
            'detected_texts': ocr_result.get('texts', [])[:3],
            'quality_score': round(quality_score, 1),  # ← 添加这一行
            'theme_score': round(theme_score, 1)  
        }
    
    def _analyze_with_clip(self, frames: List) -> Dict:
        """CLIP画面识别"""
        if not self.clip_model:
            return {'score': 50, 'matches': []}
        
        # 准备文本特征
        text_tokens = clip.tokenize(self.campus_descriptions).to(self.device)
        with torch.no_grad():
            text_features = self.clip_model.encode_text(text_tokens)
            text_features /= text_features.norm(dim=-1, keepdim=True)
        
        frame_scores = []
        all_matches = []
        
        # 分析前5帧
        for i, frame in enumerate(frames[:5]):
            try:
                # 转换帧格式
                if hasattr(frame, 'convert'):
                    pil_image = frame.convert('RGB')
                elif isinstance(frame, np.ndarray):
                    pil_image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                else:
                    continue
                
                # 预处理并编码
                image_input = self.clip_preprocess(pil_image).unsqueeze(0).to(self.device)
                with torch.no_grad():
                    image_features = self.clip_model.encode_image(image_input)
                    image_features /= image_features.norm(dim=-1, keepdim=True)
                    
                    # 计算相似度
                    similarity = (image_features @ text_features.T).squeeze(0)
                    similarity = (similarity + 1) / 2  # 归一化到0-1
                    
                    max_score = float(similarity.max().cpu()) * 100
                    frame_scores.append(max_score)
                    
                    # 找出匹配的描述
                    top_indices = similarity.topk(3).indices
                    for idx in top_indices:
                        match = self.campus_descriptions[idx]
                        if match not in all_matches and similarity[idx] > 0.5:
                            all_matches.append(match)
                            
            except Exception as e:
                logger.warning(f"CLIP帧{i}分析失败: {e}")
        
        avg_score = sum(frame_scores) / len(frame_scores) if frame_scores else 50
        
        return {
            'score': avg_score,
            'matches': all_matches[:5]
        }
    
    def _analyze_with_ocr(self, frames: List) -> Dict:
        """OCR文字识别"""
        if not self.ocr_reader:
            return {'score': 30, 'texts': [], 'keywords': []}
        
        all_texts = []
        matched_keywords = set()
        
        # 分析前3帧（OCR较慢，只分析3帧）
        for i, frame in enumerate(frames[:3]):
            try:
                # 转换帧格式
                if hasattr(frame, 'convert'):
                    frame_np = np.array(frame.convert('RGB'))
                    frame_bgr = cv2.cvtColor(frame_np, cv2.COLOR_RGB2BGR)
                elif isinstance(frame, np.ndarray):
                    frame_bgr = frame
                else:
                    continue
                
                # OCR识别
                results = self.ocr_reader.readtext(frame_bgr, paragraph=False)
                
                for (bbox, text, confidence) in results:
                    if confidence > 0.5 and len(text) > 1:
                        all_texts.append(text)
                        # 检查是否包含校园关键词
                        for kw in self.campus_keywords:
                            if kw in text:
                                matched_keywords.add(kw)
                                
            except Exception as e:
                logger.warning(f"OCR帧{i}分析失败: {e}")
        
        # 计算得分
        if matched_keywords:
            # 每匹配一个关键词加15分，最高95
            score = min(95, 20 + len(matched_keywords) * 15)
        elif all_texts:
            score = 55  # 有文字但无关键词，给基础分
        else:
            score = 45  # 无文字
        
        return {
            'score': score,
            'texts': all_texts[:5],
            'keywords': list(matched_keywords)[:5]
        }
    
    def _analyze_filename(self, filename: str) -> Dict:
        """文件名分析（兜底）"""
        if not filename:
            return {'score': 20, 'keywords': []}
        
        filename_lower = filename.lower()
        matched = []
        score = 15
        
        for kw in self.campus_keywords:
            if kw in filename_lower:
                score += 20
                matched.append(kw)
        
        return {
            'score': min(95, score),
            'keywords': matched[:5]
        }
    
    def _identify_content_type(self, clip_result: Dict, ocr_result: Dict, filename: str) -> str:
        """识别内容类型"""
        # 根据CLIP匹配结果判断
        matches = clip_result.get('matches', [])
        ocr_keywords = ocr_result.get('keywords', [])
        
        if any(w in str(matches).lower() for w in ['dance', '舞蹈']):
            return '舞蹈类'
        elif any(w in str(matches).lower() for w in ['sing', '音乐']):
            return '音乐类'
        elif any(w in str(matches).lower() for w in ['sport', '运动', '体育']):
            return '运动类'
        elif any(w in str(matches).lower() for w in ['film', '短剧', '微电影']):
            return '影视类'
        elif any(w in ocr_keywords for w in ['vlog', '记录', '日常']):
            return '记录类'
        elif any(w in filename for w in self.campus_keywords):
            return '创意短片'
        else:
            return '创意短片'
    
    def _generate_tags(self, clip_result: Dict, ocr_result: Dict, name_result: Dict) -> List:
        """生成标签"""
        tags = []
        
        # 从CLIP匹配中提取
        for match in clip_result.get('matches', [])[:2]:
            tags.append(match[:10])
        
        # 从OCR关键词中提取
        for kw in ocr_result.get('keywords', [])[:2]:
            if kw not in tags:
                tags.append(kw)
        
        # 从文件名中提取
        for kw in name_result.get('keywords', [])[:1]:
            if kw not in tags:
                tags.append(kw)
        
        if not tags:
            tags = ['创意', '校园']
        
        return tags
    
    def _generate_message(self, passed: bool, score: float, content_type: str, 
                          clip_result: Dict, ocr_result: Dict) -> str:
        """生成审核意见"""
        if passed:
            if score >= 85:
                msg = f'🎉 优秀作品！{content_type}内容精彩，与校园文化高度契合'
            elif score >= 70:
                msg = f'✨ 良好作品！{content_type}内容积极向上，符合校园主题'
            else:
                msg = f'📌 通过审核！{content_type}内容健康，建议稍作优化'
            
            # 添加具体识别信息
            if clip_result.get('matches'):
                msg += f'\n📸 画面识别：{", ".join(clip_result["matches"][:2])}'
            if ocr_result.get('keywords'):
                msg += f'\n📝 文字识别：{", ".join(ocr_result["keywords"][:2])}'
        else:
            if score >= 45:
                msg = f'📝 待改进：{content_type}基础良好，建议增强校园元素'
            else:
                msg = f'💡 建议修改：视频内容与校园文化关联度较低'
        
        return msg
    
    def _generate_suggestions(self, score: float, content_type: str, 
                              clip_result: Dict, ocr_result: Dict) -> List:
        """生成改进建议"""
        suggestions = []
        
        if score < 70:
            suggestions.append('🎨 建议增加更多校园元素（场景、活动、人物）')
        
        if score < 60:
            suggestions.append('📚 内容可更贴近校园生活主题')
        
        if clip_result.get('score', 0) < 50:
            suggestions.append('🏫 建议拍摄校园场景，如操场、教室、图书馆等')
        
        if ocr_result.get('score', 0) < 40:
            suggestions.append('📝 可添加标题字幕或校园相关文字说明')
        
        if '舞蹈' in content_type and score < 80:
            suggestions.append('💃 舞蹈类作品可增加队形变化和创意编排')
        
        if '音乐' in content_type and score < 80:
            suggestions.append('🎵 音乐类作品可尝试原创或改编')
        
        if not suggestions:
            suggestions.append('🌟 作品很棒！继续保持创意热情')
        
        return suggestions[:3]
    
    def _generate_frame_details(self, frames: List, total_score: float,
                                 clip_result: Dict, ocr_result: Dict) -> List:
        """生成帧分析详情"""
        frame_details = []
        
        for i in range(min(len(frames), 8)):
            if total_score >= 85:
                status = 'excellent'
                analysis = f'第{i+1}帧：画面精美，内容精彩 ✨'
            elif total_score >= 70:
                status = 'good'
                analysis = f'第{i+1}帧：内容清晰，表达明确 👍'
            elif total_score >= 55:
                status = 'normal'
                analysis = f'第{i+1}帧：内容合格，有提升空间 📌'
            else:
                status = 'warning'
                analysis = f'第{i+1}帧：建议增强校园元素或创意性 💡'
            
            frame_details.append({
                'frame': i + 1,
                'analysis': analysis,
                'status': status
            })
        
        return frame_details
    
    def _check_violations(self, frames: List, filename: str) -> Dict:
        """检测违规内容"""
        violations = []
        
        # 1. 文件名检测
        if filename:
            filename_lower = filename.lower()
            for kw in self.violation_keywords:
                if kw.lower() in filename_lower:
                    violations.append(f'文件名包含敏感词: {kw}')
        
        # 2. OCR文字检测
        if self.ocr_reader:
            for i, frame in enumerate(frames[:3]):
                try:
                    if hasattr(frame, 'convert'):
                        frame_np = np.array(frame.convert('RGB'))
                        frame_bgr = cv2.cvtColor(frame_np, cv2.COLOR_RGB2BGR)
                    elif isinstance(frame, np.ndarray):
                        frame_bgr = frame
                    else:
                        continue
                    
                    results = self.ocr_reader.readtext(frame_bgr, paragraph=False)
                    
                    for (bbox, text, confidence) in results:
                        if confidence > 0.5:
                            text_lower = text.lower()
                            for kw in self.violation_keywords:
                                if kw.lower() in text_lower:
                                    violations.append(f'第{i+1}帧文字包含敏感词"{kw}": {text[:20]}')
                                    
                except Exception as e:
                    logger.warning(f"违规检测-OCR帧{i}失败: {e}")
        
        # 3. CLIP违规画面检测
        if self.clip_model and self.violation_descriptions:
            try:
                text_tokens = clip.tokenize(self.violation_descriptions).to(self.device)
                with torch.no_grad():
                    text_features = self.clip_model.encode_text(text_tokens)
                    text_features /= text_features.norm(dim=-1, keepdim=True)
                
                for i, frame in enumerate(frames[:5]):
                    try:
                        if hasattr(frame, 'convert'):
                            pil_image = frame.convert('RGB')
                        elif isinstance(frame, np.ndarray):
                            pil_image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                        else:
                            continue
                        
                        image_input = self.clip_preprocess(pil_image).unsqueeze(0).to(self.device)
                        with torch.no_grad():
                            image_features = self.clip_model.encode_image(image_input)
                            image_features /= image_features.norm(dim=-1, keepdim=True)
                            
                            similarity = (image_features @ text_features.T).squeeze(0)
                            similarity = (similarity + 1) / 2
                            
                            max_score = float(similarity.max().cpu())
                            max_idx = int(similarity.argmax().cpu())
                            
                            if max_score > 0.75:
                                violation_desc = self.violation_descriptions[max_idx]
                                violations.append(f'第{i+1}帧检测到疑似{violation_desc}内容(置信度{max_score:.2f})')
                                
                    except Exception as e:
                        logger.warning(f"违规检测-CLIP帧{i}失败: {e}")
                        
            except Exception as e:
                logger.warning(f"违规检测-CLIP初始化失败: {e}")
        
        violations = list(set(violations))
        
        return {
            'has_violation': len(violations) > 0,
            'reason': '；'.join(violations[:3]) if violations else '',
            'details': violations
        }

    def _get_default_result(self, message: str, score: int) -> Dict:
        """返回默认结果"""
        return {
            'passed': False,
            'score': score,
            'content_type': '创意短片',
            'tags': ['创意', '校园'],
            'suggestions': ['请上传有效的视频文件'],
            'message': message,
            'frames_analyzed': 0,
            'frame_details': [],
            'clip_score': 0,
            'ocr_score': 0
        }