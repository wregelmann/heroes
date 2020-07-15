class HealthBar extends HTMLElement {

    get disabled() {
        return this.hasAttribute("disabled");
    }
        
    set disabled(val) {
        if (val) {
            this.setAttribute("disabled", "");
        } else {
            this.removeAttribute("disabled");
        }
    }
    
    get value() {
        return this.getAttribute("value");
    }
        
    set value(val) {
        this.setAttribute("value", val);
    }
    
    get max() {
        return this.getAttribute("max");
    }
        
    set max(val) {
        this.setAttribute("max", val);
    }
    
    get temp() {
        return this.getAttribute("temp");
    }
        
    set temp(val) {
        this.setAttribute("temp", val);
    }
    
    static get observedAttributes() { 
        return ["value", "max", "temp"]; 
    }
    
    connectedCallback() {
        let shadowRoot = this.attachShadow({mode: "open"});
        $(shadowRoot).append(
            `<style>
                div.background {
                    position: absolute;
                    left: 0;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    background: #333;
                }
                div.primary, div.secondary {
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                }
                div.secondary {
                    background: #39f;
                }
            </style>
            <div class="background"></div>
            <div class="primary" max=${ this.max } value=${ this.value }></div>
            <div class="secondary" max=${ this.max } value=${ this.temp }></div>`
        );
        $(this).css("position", "relative");
        $(this).on("click", () => {
            UIkit.modal.prompt("Change:").then( (change) => {
                let matches = change.match(/\(([0-9]+)\)/);
                if ( matches ) {
                    this.temp = parseInt(matches[1]);
                } else if ( parseInt(change) > 0 ) {
                    this.value = Math.min( parseInt(this.value) + parseInt(change), parseInt(this.max) );
                    console.log(this.value);
                } else if ( Math.abs(change) < parseInt(this.temp) ) {
                    this.temp = parseInt(this.temp) + parseInt(change);
                } else {
                    this.value = Math.max( parseInt(this.value) + parseInt(change) + parseInt(this.temp), 0 );
                    this.temp = 0;
                }
            });
        });
        this.paintProgress();
        this.paintProgress(true);
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "value":
                this.paintProgress();
                break;
            case "temp":
                this.paintProgress(true);
                break;
        }
    }
    
    paintProgress(secondary = false) {
        let p = Math.min( Math.max( (secondary ? this.temp : this.value) / this.max, 0 ), 1 ); 
        $(this).attr("uk-tooltip", `title: ${ this.value }${ this.temp > 0 ? ` + ${ this.temp }` : "" } / ${ this.max }`);
        $(this.shadowRoot).find(`.${ secondary ? "secondary" : "primary" }`).animate({
            width: $(this).width() * p
        }, 500);
        if (!secondary) {
            let color = (p > .5 ? `rgb(${ Math.ceil(510*(1 - p)) }, 255, 0)` : `rgb(255, ${ Math.ceil(510*p) }, 0)`);
            $(this.shadowRoot).find(".primary").css("background", color);
        }
    }
        
}

window.customElements.define("health-bar", HealthBar);