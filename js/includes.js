Date.prototype.now = function () {
    var day = ((this.getDate() < 10)?"0":"") + this.getDate();
    var month = (((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1);
    var year = this.getFullYear();
    var hours = ((this.getHours() < 10)?"0":"") + this.getHours();
    var minutes = ((this.getMinutes() < 10)?"0":"") + this.getMinutes();
    var seconds = ((this.getSeconds() < 10)?"0":"") + this.getSeconds();

    return year+"-"+month+"-"+day+" "+hours+":"+minutes+":"+seconds;
};

function fetch_post(url, data) {
    var fd = new FormData();
    //very simply, doesn't handle complete objects
    for(var i in data){
        fd.append(i,data[i]);
    }
    var req = new Request(url,{
        method:"POST",
        body:fd,
        mode:"cors"
    });
    return fetch(req);
}