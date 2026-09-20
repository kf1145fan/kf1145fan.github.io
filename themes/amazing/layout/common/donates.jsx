const { Component } = require('inferno');

module.exports = class extends Component {
    render() {
        const { helper } = this.props;
        const { __ } = helper;
        const donateUrl = 'https://p2.802213.xyz/%E6%89%93%E8%B5%8F.jpg';
        return <div class="card">
            <div class="card-content">
                <h3 class="menu-label has-text-centered">{__('donate.title')}</h3>
                <div class="buttons is-centered">
                    <a class="button donate is-link" href={donateUrl} target="_blank" rel="noopener">赏</a>
                </div>
            </div>
        </div>;
    }
};
