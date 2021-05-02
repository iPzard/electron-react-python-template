import React from 'react';
import "./resourceBar.scss";

export const ResourceBar = (props) => {
    const { barColor, resource } = props;

    const containerStyle = {
        height: 20,
        width: '75vw',
        backgroundColor: '#e6e8e7',
    }

    const fillerStyle = {
        height : '100%',
        width : resource,
        backgroundColor : barColor,
        transition: 'width 1s ease-in-out',
        textAlign: 'right'
        
    }

    const labelStyle = {
        color: 'white',
        fontSize: '10px',
        height: '100%',
        fontWeight : 'bold',

    }

    return (
        <div style = {containerStyle} id = 'parent'>
                <div style = {fillerStyle} id = 'child'>
                    <span style = {labelStyle} id = 'child'>{resource}</span>
                </div>
        </div>
    );
};

export default ResourceBar