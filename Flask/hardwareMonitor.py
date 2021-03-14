import psutil
import time
import collections
from Flask.powerShellInterface import PowerShellInterface

class HardwareMonitor:
    def __init__(self):
        self.psi = PowerShellInterface()

#<------------ CPU Stats ------------->
    def getCPUPercentage(self, step = 1, byCore = False):
        cpuPercent = psutil.cpu_percent(interval=step, percpu=byCore)
        return cpuPercent

    def getCPUFrequency(self):
        res = self.psi.getCurrentClockSpeed()
        cpuFreq = []
        res = res.split(' ')
        res[0] = round(float(res[0]), 2)
        res[1] = int(res[1])
        return res
#<------------ End Cpu Stats ---------->
#<------------ Gpu Stats -------------->
# - Get Clock speed
# - Get Temp
# - Get Utilization %
#<------------ End Gpu Stats ---------->
#<------------ Ram Stats -------------->
# - Get Utilization % 
# - Get Utilization [Used, Total, Free]?
#<------------ End Ram Stats ---------->
#<------------ Drive Stats ------------>
# - Get Drive usage [Used, Total, Free]
# - Only get the first 2/3 drives
#<------------ End Drive Stats -------->
#<------------ Network Stats ---------->
# - Get Active connection type? 
# - Get download 
# - Get upload
#<------------ End Network Stats ------>
#<------------ Processes Stats -------->
#<------------ End Processes Stats ---->
