import subprocess
class PowerShellInterface:
    def __init__(self):
        pass

    def runCommand(self, cmd):
        result = subprocess.run(["powershell", "-Command", cmd], capture_output=True)
        return result

    def printTestCommandOutput(self):
        testCommand = "Write-Host Hello World!"
        res = self.runCommand(testCommand)
        print(str(res.stdout)[2:-3])
    

    def getCurrentClockSpeed(self):
        command = '''
            $MaxClockSpeed = (Get-CimInstance CIM_Processor).MaxClockSpeed
            $ProcessorPerformance = (Get-Counter -Counter "\Processor Information(_Total)\% Processor Performance").CounterSamples.CookedValue
            $CurrentClockSpeed = $MaxClockSpeed*($ProcessorPerformance/100)
            Write-Host $CurrentClockSpeed, $MaxClockSpeed 
            '''
        res = self.runCommand(command)
        return str(res.stdout)[2:-3]


        

