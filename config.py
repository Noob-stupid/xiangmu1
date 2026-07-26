"""
配置文件
"""

import os

class Config:
    """基础配置"""
    SECRET_KEY = 'your-secret-key-here'
    
    # 上传配置
    UPLOAD_FOLDER = 'uploads'
    MAX_CONTENT_LENGTH = 500 * 1024 * 1024  # 500MB
    
    # 视频处理配置
    MAX_FRAMES = 15  # 最大抽帧数
    
    # 数据库配置
    DB_CONFIG = {
        'user': 'root',
        'password': '@Love3344521@',
        'database': 'userdb',
        'host': 'localhost',
        'port': 3306
    }
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:%40Love3344521%40@localhost/userdb'


class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True


class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False