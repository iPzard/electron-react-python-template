import psutil
import time
import collections


class HardwareMonitor:
    def __init__(self):
        print('helloworld')

    def getCPUPercentage(self):
        cpu = psutil.cpu_percent(percpu=True)
        return cpu

    
