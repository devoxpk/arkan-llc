export default function showLoader(show) {
    console.log(`Showing loader: ${show}`);
    const loaderStyle = `
        .custom-loader {
            display: ${show ? 'block' : 'none'};
            width: 70px;
            top:15%;
            height: 70px;
            position: fixed;
            margin-left: 50%;
            margin-top: 20%;
            background: #ffa600;
            z-index: 9999;
            border-radius: 50px;
            -webkit-mask: radial-gradient(circle 31px at 50% calc(100% + 13px), #000 95%, #0000) top 4px left 50%, radial-gradient(circle 31px, #000 95%, #0000) center, radial-gradient(circle 31px at 50% -13px, #000 95%, #0000) bottom 4px left 50%, linear-gradient(#000 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            -webkit-mask-repeat: no-repeat;
            animation: cu10 1.5s infinite;
        }

        @keyframes cu10 {
            0% {
                -webkit-mask-size: 0    18px,0    18px,0    18px,auto
            }

            16.67% {
                -webkit-mask-size: 100% 18px,0    18px,0    18px,auto
            }

            33.33% {
                -webkit-mask-size: 100% 18px,100% 18px,0    18px,auto
            }

            50% {
                -webkit-mask-size: 100% 18px,100% 18px,100% 18px,auto
            }

            66.67% {
                -webkit-mask-size: 0    18px,100% 18px,100% 18px,auto
            }

            83.33% {
                -webkit-mask-size: 0    18px,0    18px,100% 18px,auto
            }

            100% {
                -webkit-mask-size: 0    18px,0    18px,0    18px,auto
            }
        }
    `;

    // Add styles to document
    const styleSheet = document.createElement("style");
    styleSheet.innerText = loaderStyle;
    document.head.appendChild(styleSheet);
    console.log('Added loader styles to document');

    // Add loader div if it doesn't exist
    if (!document.querySelector('.custom-loader')) {
        const loaderDiv = document.createElement('div');
        loaderDiv.className = 'custom-loader';
        document.body.appendChild(loaderDiv);
        console.log('Added loader div to body');
    }

    // Show/hide loader
    document.querySelector('.custom-loader').style.display = show ? 'block' : 'none';
    console.log(`Loader visibility set to ${show}`);
}
