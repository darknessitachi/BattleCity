/****************************************
 * 爆炸类
 ****************************************/
var Boom = Class(
{
	_big: false,
	_start: false,
	_sptBoom: null,
	_tickBoom: null,



	Boom: function(big)
	{
		// 创建爆炸精灵
		this._sptBoom = new Sprite("res/Boom.png", 64, 64);
		this._sptBoom.Hide();
		this._sptBoom.SetZ(Const.Z_BOOM);
		this._sptBoom.SetFrameSeq(big ? [0,1,2,3,4,1] : [0,1]);
		App.GameUI.Append(this._sptBoom);


		this._big = big;
		this._tickBoom = new Tick(4);
	},


	Update: function()
	{
		if(!this._start)
			return;

		// 大的爆炸过程中稍作延时
		if(this._big && !this._tickBoom.On())
			return;

		// 显示爆炸动画帧
		this._sptBoom.NextFrame();

		// 爆炸结束
		if(this._sptBoom.GetFrame() == 0)
		{
			this._sptBoom.Hide();
			this._start = false;
			return true;
		}
	},


	Start: function(x, y)
	{
		// 定位爆炸精灵
		this._sptBoom.Move(Const.POS_X + x, Const.POS_Y + y);

		// 开始播放爆炸动画
		this._sptBoom.Show();
		this._start = true;
	},


	Reset: function()
	{
		// 重置爆炸对象
		this._sptBoom.Hide();
		this._tickBoom.Reset();
		this._start = false;
	}
});