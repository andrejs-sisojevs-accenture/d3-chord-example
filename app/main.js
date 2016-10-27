// aws s3 sync . s3://andrey-charts-proto/ --region us-west-1 --exclude ".git/*" --exclude "*.DS_Store*"

$(".dropdown-menu li a").click(function(){
    $(this).parents(".dropdown").find('.btn').html($(this).text());
    $(this).parents(".dropdown").find('.btn').val($(this).data('value'));
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
