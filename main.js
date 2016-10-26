$(".dropdown-menu li a").click(function(){
    $(this).parents(".dropdown").find('.btn').html($(this).text());
    $(this).parents(".dropdown").find('.btn').val($(this).data('value'));
});
$(function() {
    // $('input').rangePicker({ minDate:[1,2008] })
    //     .on('datePicker.done', function(e, result){
    //         console.log(result);
    //     });
});


var chordData = prepareChordsData(businessData);
console.log(chordData);

var chordConfig = {
    width:  600,
    height: 600,
    chordData: chordData,
    bindto: '#chord',
    bindto_subchart: '#subchart',
}

$(function() {
    drawChord(chordConfig);
});
