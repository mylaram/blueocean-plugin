import React, { Component } from 'react';

// Noddy component to render via ExtensionRenderer
// and trigger CSS loading from this plugin
export default class EditorCSS extends Component {
    render() {
        return (<span />);
    }
}


// TODO: Make the route extensionpoint do the same loading/unloading as the component extensionpoint, then remove this
