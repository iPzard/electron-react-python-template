import { Fragment } from 'react';
import React, { Component } from 'react';
import Titlebar from 'components/titlebar/Titlebar';
import { customTheme } from 'theme/palette';
import { loadTheme } from 'office-ui-fabric-react';
import logo from 'logo.svg';
import styles from './App.module.scss';
import 'antd/dist/antd.dark.css';
import { Button } from 'antd';

loadTheme({ palette: customTheme });

export default class App extends Component {
    constructor(props){
        super(props);
        this._host = 'http://localhost:3001';
        this.state = {
            monitorBtnTxt: 'Start Monitors',
            cpuWatch: null,
            cpuPercent: 0,
        }
    }
    
    _toggleWatches = () => {
        const cpuWatch = this._toggleCpuWatch();
        this.setState({
            monitorBtnTxt: this.state.monitorBtnTxt === 'Start Monitors' ? 'Start Monitors' : 'Stop Monitors',
            cpuWatch,
        });
    };


    _toggleCpuWatch = () => {
        let cpuWatch = null;
        if (this.state.cpuWatch === null) {
            cpuWatch = setInterval( async () => {
                const res = await fetch(`${this._host}/CPUPercent`, {

                }).then(res => res.json());
                console.log(res);
                this.setState({cpuPercent: res}); 
            }, 1000);
        } else {
            clearInterval(this.state.cpuWatch);
            this.setState({cpuPercent: 0});
        }
        return cpuWatch;
    }

    render() {
        function getEachCore(percent) {
            let div = document.createElement('div');
            let threads = '';
            if (percent !== 0) {
                let i = 0;
                percent.forEach( t => {
                    threads += `<span>Thread ${i}: ${t}%</span></br>`;
                    i += 1;
                });
            }
            div.innerHTML = threads;

            let cpu = document.getElementById('CpuUsageWrapper');
            if (cpu) {
                cpu.append(div)
            }
        }
        getEachCore(this.state.cpuPercent)
        return (
            <Fragment>
                <Titlebar/>
                <div className={ styles.app }>
                    <header className={ styles['app-header']}>
                        <Button id="toggleMonitorBtn" type="primary" shape="round" onClick={async () => this._toggleWatches()}>
                            {this.state.monitorBtnTxt}
                        </Button>
                        <div id="CpuUsageWrapper" style={{'font-size': 'small'}}>
                        </div>
                        <div id="RamUsageWrapper">
                            <span>

                            </span>
                        </div>
                        <div id="GpuUsageWrapper">
                            <span>

                            </span>
                        </div>  
                    </header>
                </div>
            </Fragment>
        )
    }


}