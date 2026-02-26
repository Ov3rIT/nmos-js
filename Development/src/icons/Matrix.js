import React from 'react';
import { SvgIcon } from '@material-ui/core';

const SvgMatrix = props => {
  // Definiamo i colori come costanti per una facile manutenzione
    const colorBlue = "#2B79C2"; // Corrisponde a .st0
    const colorDark = "#3B4652"; // Corrisponde a .st1

    return (
    <SvgIcon viewBox="0 0 512 512" {...props}>
        <g>
            {/* Path originariamente con classe .st1 (Grigio Scuro) */}
            <path 
            fill={colorDark} 
            d="M231.9,19.2H51.7c-11.5,0-20.8,9.3-20.8,20.8v109.4h221.8V40C252.7,28.5,243.3,19.2,231.9,19.2z"
        />
        <path 
            fill={colorDark} 
            d="M30.9,173.1c0,11.5,9.3,20.8,20.8,20.8h72.6v46.3h-20.4c-3.9,0-7,3.1-7,7c0,3.9,3.1,7,7,7h75.7c3.9,0,7-3.1,7-7c0-3.9-3.1-7-7-7h-21.2v-46.3h73.4c11.5,0,20.8-9.3,20.8-20.8v-9.7H30.9V173.1z"
        />
        <path 
            fill={colorDark} 
            d="M259.3,411.7c0,3.2,0.7,6.2,2,8.9c3.3,7,10.5,11.9,18.8,11.9h72.6v46.3h-20.4c-3.9,0-7,3.1-7,7c0,3.9,3.1,7,7,7h75.7c3.9,0,7-3.1,7-7c0-3.9-3.1-7-7-7h-21.2v-46.3h73.4c11.5,0,20.8-9.3,20.8-20.8v-9.7H259.3V411.7z"
        />
        <path 
            fill={colorDark} 
            d="M460.3,257.8H280.1c-11.5,0-20.8,9.3-20.8,20.8v109.4h221.8V278.6C481.1,267.1,471.8,257.8,460.3,257.8z"
        />

        {/* Path originariamente con classe .st0 (Blu) */}
        <path 
            fill={colorBlue} 
            d="M335.9,113.5c2.8,13.6,13.5,24.3,27,27c0,0.2,0,0.5,0,0.7v102.6h14V141.2c0-0.2,0-0.5,0-0.7c15.8-3.2,27.7-17.2,27.7-34c0-19.2-15.5-34.7-34.7-34.7c-16.8,0-30.8,11.9-34,27.7c-0.2,0-0.5,0-0.7,0h-68.5v14h68.5C335.4,113.5,335.6,113.5,335.9,113.5z"
        />
        <path 
            fill={colorBlue} 
            d="M245.3,406.6h-68.5c-0.2,0-0.5,0-0.7,0c-2.8-13.6-13.5-24.3-27-27c0-0.2,0-0.5,0-0.7V268.2h-14V379c0,0.2,0,0.5,0,0.7c-15.8,3.2-27.7,17.2-27.7,34c0,19.2,15.5,34.7,34.7,34.7c16.8,0,30.8-11.9,34-27.7c0.2,0,0.5,0,0.7,0h69.7c-0.8-2.9-1.1-5.9-1.1-8.9V406.6z"
        />
      </g>
    </SvgIcon>
    );
};

export default SvgMatrix