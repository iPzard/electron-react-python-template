import psutil
import time
import collections


class HardwareMonitor:
    def __init__(self):
        print('helloworld')

    def getCPUPercentage(self):
        cpuPercent = psutil.cpu_percent(interval = 1, percpu=True)
        return cpu

    def getCPUFrequency(self):
        cpuFreq = psutil.cpu_freq(interval = 1, percpu=True)
        return cpuFreq

    
