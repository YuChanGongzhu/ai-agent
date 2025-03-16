#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
极简版 Webhook Server (Flask版本)
==============================

功能：接收GitHub的webhook请求，自动更新代码

使用方法：
python webhook_server.py
"""

import os
import subprocess
from flask import Flask, request

# 仓库路径
REPO_PATH = os.path.dirname(os.path.abspath(__file__))

# Flask应用初始化
app = Flask(__name__)

@app.route('/update', methods=['POST'])
def update_code():
    """
    处理GitHub webhook请求，执行代码更新
    """
    try:
        print('接收到GitHub webhook请求')
        
        # 直接执行Git命令
        try:
            print('开始执行git fetch --all')
            subprocess.run(['git', 'fetch', '--all'], check=True, cwd=REPO_PATH)
            print('git fetch --all 成功')

            print('开始执行git reset --hard origin/main')
            subprocess.run(['git', 'reset', '--hard', 'origin/main'], check=True, cwd=REPO_PATH)
            print('git reset --hard origin/main 成功')
        except subprocess.CalledProcessError as e:
            print(f'Git命令执行失败: {e}')
            raise

        print('代码更新成功')
        return "更新成功", 200
    except Exception as e:
        print(f'代码更新失败: {e}')
        return "更新失败", 500

# 直接运行Flask应用
if __name__ == "__main__":
    # 在容器中运行时使用0.0.0.0，并关闭debug模式
    app.run(host='0.0.0.0', port=6666, debug=False)