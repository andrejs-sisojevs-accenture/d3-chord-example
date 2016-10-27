// TODO add color scheme generator

var COLOR_SCHEME =
    [ "#e69373", "#805240", "#e6d5cf", "#bf5830"
    , "#77d36a", "#488040", "#d2e6cf", "#43bf30"
    , "#557aaa", "#405c80", "#cfd9e6", "#306ebf"
    ];

function colorByIdx(idx) {
    return COLOR_SCHEME[idx % COLOR_SCHEME.length];
}
