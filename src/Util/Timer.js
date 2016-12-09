/**
 * 精确定时器
 */
function Timer(lisn, time)
{
	var last = +new Date;
	var delay;
	var tid;


	function Update()
	{
		//
		// 时间差累计
		//
		var cur = +new Date;
		delay += (cur - last);
		last = cur;

		if(delay >= time)
		{
			lisn.OnTimer();
			delay %= time;
		}
	}

	this.Start = function()
	{
		delay = 0;
		tid = setInterval(Update, 1);
	};

	this.Stop = function()
	{
		clearInterval(tid);
	};
}