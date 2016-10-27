var   dims = ['client', 'cloud_provider'];
var totals = ['cost'];
var scoreField = totals[0];

function otherThanDim(dim) {
    return dims[0] === dim ? dims[1] : dims[0];
}

var BD_initialMonth = moment("2016/01/01", "YYYY/MM/DD");
var BD_endMonth = undefined;

// generate timeseries
function distOnTimestamps(businessData, monthsCount) {
    var newBD = [];

    businessData.forEach(function(row) {

        var initialAvg = row[scoreField] / monthsCount;
        var curMonth = BD_initialMonth.clone();
        var curAvg   = initialAvg;
        for(var i = 0; i < monthsCount; i++) {
            var newRow = _.cloneDeep(row);
            newRow[scoreField] = Math.round(curAvg);
            newRow.timestamp = curMonth.toDate();
            newBD.push(newRow);

            BD_endMonth = curMonth.clone();

            curAvg = curAvg + (Math.random() * 0.2 - 0.1) * initialAvg;
            curMonth = curMonth.add(1, 'month');
        }
    });

    return newBD;
}

var businessData = [
    { client: 'clientA', cloud_provider: 'Azure',     cost:  1000 },
    { client: 'clientA', cloud_provider: 'AWS',       cost: 40000 },
    { client: 'clientA', cloud_provider: 'Google',    cost: 10000 },
    { client: 'clientA', cloud_provider: 'OpenStack', cost: 15000 },

    { client: 'clientB', cloud_provider: 'Azure',     cost:  5000 },
    { client: 'clientB', cloud_provider: 'AWS',       cost:  2000 },
    { client: 'clientB', cloud_provider: 'Google',    cost:  3000 },
    { client: 'clientB', cloud_provider: 'OpenStack', cost: 20000 },

    { client: 'clientC', cloud_provider: 'Azure',     cost: 50000 },
    { client: 'clientC', cloud_provider: 'AWS',       cost: 20000 },
    { client: 'clientC', cloud_provider: 'Google',    cost: 30000 },
    { client: 'clientC', cloud_provider: 'OpenStack', cost:  2000 },
];

businessData = distOnTimestamps(businessData, 12);

function prepareChordsData(businessData) {
    var idx = [];

    dims.forEach(function(dim) {
        var reducerF = function(accum, elem) {
            var addressedElem = { dim: dim, elem: elem[dim], total: elem[scoreField] };
            var foundIdx = _.findIndex(idx, function(checkedElem) {
                var eq = true;
                eq = eq && (addressedElem.dim  === checkedElem.dim);
                eq = eq && (addressedElem.elem === checkedElem.elem);
                return eq;
            });

            if(foundIdx === -1) {
                addressedElem.index = idx.length;
                idx.push(addressedElem);
            } else {
                idx[foundIdx].total += addressedElem.total;
            }
        }
        _.reduce(businessData, reducerF, idx);
    });

    var matrix = [];

    _.forEach(idx, function(addressedElemX) {
        var matrixRow = [];
        _.forEach(idx, function(addressedElemY) {
            if(dims.indexOf(addressedElemX.dim) === dims.indexOf(addressedElemY.dim)) {
                matrixRow.push(0);
            } else {
                var relevantBD = _.filter(businessData, function(elem) {
                        var eq = true;
                        eq = eq && (elem[addressedElemX.dim] === addressedElemX.elem);
                        eq = eq && (elem[addressedElemY.dim] === addressedElemY.elem);
                        return eq;
                    })
                function reducer(accum, elem) { return accum + elem[scoreField]; }
                var sum = _.reduce(relevantBD, reducer, 0);
                matrixRow.push(sum);
            }
        });

        matrix.push(matrixRow);
    });

    return {
        idx: idx,
        matrix: matrix
    }
}

function findInIdx(idx, dim, elem) {
    return _.findIndex(idx, function(addressedElem) {
        return addressedElem.elem === elem && addressedElem.dim === dim;
    });
}
