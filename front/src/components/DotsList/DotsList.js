import React from 'react';

class DotsList extends React.Component {

    static defaultProps = {
        dots: []
    };

    constructor(props) {
        super(props);
    }

    render() {

        const {dots} = this.props;

        return (
            <div className={`dots-list`}>
                <div className={`dots-list__content`}>
                    {
                        dots.map((dot, index) => <div key={`dot__${index}__x${dot.x}__y${dot.y}`} className={`dots-list__dot`}>( <span title={dot.x}>x:{dot.x}</span> ; <span title={dot.y}>y:{dot.y}</span> )</div>)
                    }
                </div>
            </div>
        )
    }
}

export default DotsList;