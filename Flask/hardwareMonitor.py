import psutil
import time
import collections


class HardwareMonitor:
    def __init__(self):
        print('helloworld')

    def getCPUPercentage(self):
        cpuPercent = psutil.cpu_percent(interval=3, percpu=True)
        return cpuPercent

    def getCPUFrequency(self):
        cpuFreq = psutil.cpu_freq(percpu=True)
        return cpuFreq

    
