"""
视频处理工具模块
"""
import cv2
import os
import uuid
import logging
from werkzeug.utils import secure_filename
logger = logging.getLogger(__name__)
def extract_frames(video_path, max_frames=15):
    """
    从视频中抽取帧
    
    参数:
        video_path: 视频文件路径
        max_frames: 最大抽取帧数
    
    返回:
        frames: 帧列表（RGB格式的numpy数组）
    """
    frames = []#用来存放抽出来的帧图片
    
    try:
        cap = cv2.VideoCapture(video_path)#打开视频
        
        if not cap.isOpened():#检查视频是否打开的代码函数
            logger.error(f"无法打开视频: {video_path}")
            return frames
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))#获取视频总共有多少帧
        
        if total_frames == 0:
            logger.error(f"视频无帧: {video_path}")
            return frames
        
        # 计算抽帧间隔
        if total_frames > max_frames:
            interval = total_frames // max_frames
        else:
            interval = 1
        
        frame_count = 0#当前读到第几帧
        extracted = 0#已经抽了多少张
        
        while extracted < max_frames:
            ret, frame = cap.read()#frame是图片数据（帧)，ret是返回true代表读了一帧(存了帧判断有没有)
            if not ret:
                break
            
            if frame_count % interval == 0 or extracted == 0:
                # 把BGR格式转成RGB（OpenCV用的是BGR，AI模型要RGB）
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)#给视频帧换颜色格式
                
                # 调整大小，节省内存（控制宽度为640
                h, w = frame_rgb.shape[:2]
                if w > 640:
                    scale = 640 / w
                    new_w = 640
                    new_h = int(h * scale)
                    frame_rgb = cv2.resize(frame_rgb, (new_w, new_h))
                
                frames.append(frame_rgb)#存起来
                extracted += 1
            
            frame_count += 1
        
        cap.release()#关闭视频文件
        logger.info(f"抽帧完成，共{len(frames)}帧")
        
    except Exception as e:
        logger.error(f"抽帧失败: {e}")
    
    return frames


def save_uploaded_video(file, upload_folder):
    """
    保存上传的视频文件
    
    参数:
        file: Flask上传的文件对象
        upload_folder: 保存目录
    
    返回:
        tuple: (文件路径, 原文件名)
    """
    # 确保目录存在
    os.makedirs(upload_folder, exist_ok=True)
    
    # 生成唯一文件名
    filename = secure_filename(file.filename)#安全处理文件名
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    filepath = os.path.join(upload_folder, unique_filename)
    
    file.save(filepath)
    logger.info(f"视频已保存: {filepath}")
    
    return filepath, filename


def delete_video(filepath):
    """删除临时视频文件"""
    try:
        if filepath and os.path.exists(filepath):#path路径，查路径是否存在
            os.remove(filepath)
            logger.info(f"已删除临时文件: {filepath}")
    except Exception as e:
        logger.error(f"删除文件失败: {e}")


def get_video_info(video_path):
    """获取视频信息"""
    cap = cv2.VideoCapture(video_path)
    
    info = {
        'width': int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
        'height': int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
        'fps': cap.get(cv2.CAP_PROP_FPS),
        'frame_count': int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    }
    
    cap.release()
    
    if info['fps'] > 0:
        info['duration'] = info['frame_count'] / info['fps']#计算时长，时长等于总帧数➗帧率
    
    return info