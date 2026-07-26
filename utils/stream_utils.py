"""
推流工具模块
"""

import subprocess
import threading
import logging

logger = logging.getLogger(__name__)


class StreamPusher:
    """推流器"""
    
    def __init__(self):
        self.process = None
        self.is_streaming = False
        self.stream_thread = None
    
    def start(self, video_path, rtmp_url):
        """
        启动推流
        
        参数:
            video_path: 视频文件路径
            rtmp_url: RTMP推流地址
        
        返回:
            bool: 是否成功启动
        """
        # 检查FFmpeg
        if not self._check_ffmpeg():
            logger.error("FFmpeg未安装，无法推流")
            return False
        
        # 推流命令
        cmd = [
            'ffmpeg',
            '-re',                    # 按原始帧率读取
            '-i', video_path,         # 输入文件
            '-c:v', 'libx264',        # 视频编码
            '-preset', 'veryfast',    # 编码速度
            '-tune', 'zerolatency',   # 低延迟
            '-b:v', '2500k',          # 视频码率
            '-maxrate', '2500k',
            '-bufsize', '5000k',
            '-c:a', 'aac',            # 音频编码
            '-b:a', '128k',
            '-f', 'flv',              # FLV格式
            rtmp_url
        ]
        
        try:
            self.process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0
            )
            self.is_streaming = True
            logger.info(f"推流启动: {rtmp_url}")
            return True
            
        except Exception as e:
            logger.error(f"推流启动失败: {e}")
            return False
    
    def stop(self):
        """停止推流"""
        if self.process:
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
            self.process = None
            self.is_streaming = False
            logger.info("推流已停止")
    
    def _check_ffmpeg(self):
        """检查FFmpeg是否可用"""
        try:
            subprocess.run(['ffmpeg', '-version'], capture_output=True, check=False)
            return True
        except FileNotFoundError:
            return False
    
    def get_status(self):
        """获取推流状态"""
        if self.process and self.process.poll() is None:
            return 'streaming'
        return 'stopped'


# class MockStreamPusher:
#     """模拟推流器"""
    
#     def start(self, video_path, rtmp_url):
#         logger.info(f"[模拟] 推流启动: {video_path} -> {rtmp_url}")
#         return True
    
#     def stop(self):
#         logger.info("[模拟] 推流停止")
    
#     def get_status(self):
#         return 'streaming'