import os
import cv2
import numpy as np
import logging
import PIL.Image
logger=logging.getLogger(__name__)
def vitalframe(video_path,save_folder):
  # filename,ext=os.path.splitext(os.path.basename(video_path))
  video =cv2.VideoCapture(video_path)
  try:
    if not video.isOpened():
      logger.error(f'视频无法打开:{video_path}')
      return None
    ALL_frames=int(video.get(cv2.CAP_PROP_FRAME_COUNT))
    pre_frame=None
    max_diff=0
    last_frame=None
    while video.isOpened():
      ret,frames=video.read()
      if not ret:
        break
      try:
        gray_frame = cv2.cvtColor(frames, cv2.COLOR_BGR2GRAY)
      except Exception as e:
        logger.error(f"颜色转换失败: {e}")
        continue
      if pre_frame is not None:
        diff=cv2.absdiff(gray_frame,pre_frame)
        Total_diff=np.sum(diff)
        if Total_diff>max_diff:
          max_diff=Total_diff
          last_frame=frames.copy()
      pre_frame=gray_frame
    video.release()
    # print(f"[调试] 抓到最佳帧了吗？: {last_frame}")
    if last_frame is not None:
      # folder=rf"E:\项目\xiangmu\uploads\{filename}"
      # os.makedirs(folder,exist_ok=True)
       vital_path = os.path.join(save_folder, "vitalframe.jpg")
       img_rgb = cv2.cvtColor(last_frame, cv2.COLOR_BGR2RGB)
       PIL.Image.fromarray(img_rgb).save(vital_path)#PIL.Image → 用专业图片库.fromarray(img_rgb) → 把内存里的画面变成真正图片
      #  cv2.imwrite(vital_path,last_frame)
       logger.info(f"关键帧提取成功!{vital_path}")
       return vital_path
    return None
  except Exception as e:
    logger.error(f"没有找到关键帧:{str(e)}")
    return None
  # 取出关键帧做视频封面