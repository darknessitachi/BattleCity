/****************************************
 * 玩家坦克类
 ****************************************/
var MyTank = Class(Tank,
{
	_sptBulprf: null,		// 防弹衣精灵
	_timerBulprf: 0,		// 防弹时间



	MyTank: function()
	{
		this.Tank(0);	// super

		//
		// 创建防弹衣精灵
		//
		this._sptBulprf = new Sprite("res/Misc.png", 32, 32);
		this._sptBulprf.Hide();
		this._sptBulprf.SetFrameSeq(Tank.BULPRF);
		this._sptTank.Append(this._sptBulprf);

		this._tickBirth = new Tick(2);
	},


	/**
	 * 覆盖 -- 界面更新
	 */
	_UpdateUI: function()
	{
		--this._timerBulprf;

		//
		// 更新防弹衣动画
		//
		if(this._timerBulprf > 0)
		{
			this._sptBulprf.Show();
			this._sptBulprf.NextFrame();
		}
		else if(this._timerBulprf == 0)
		{
			this._sptBulprf.Hide();
		}
	},


	/**
	 * 覆盖 -- 设置类型
	 */
	_SetType: function(t)
	{
		this.Speed = 2;

		switch(t)
		{
		case 0:		// 普通
			this._fireDelay = 13;
			this._SetBullets(1, 2, false);
			break;

		case 1:		// 快速
			this._fireDelay = 11;
			this._SetBullets(1, 3, false);
			break;

		case 2:		// 连发
			this._fireDelay = 7;
			this._SetBullets(2, 3, false);
			break;

		case 3:		// 威力
			this._fireDelay = 7;
			this._SetBullets(2, 3, true);
			break;
		}

		this._icon = t;
	},


	/**
	 * 覆盖 -- 坦克被击中
	 */
	_Hit: function()
	{
		if(this._timerBulprf > 0)
		{
			return HitState.MISS;
		}
		else
		{
			this._sptTank.Hide();
			return HitState.HIT;
		}
	},


	/**
	 * 覆盖 -- 坦克爆炸
	 */
	_Boom: function()
	{
		this.SetType(0);

		// 减少1条命
		App.Game.LifeDec();

		this._state = TankState.RESET;
	},


	/**
	 * 覆盖 -- 坦克重置
	 */
	_Reset: function()
	{
		//
		// 停止防弹状态
		//
		if(this._timerBulprf > 0)
		{
			this._timerBulprf = 0;
			this._sptBulprf.Hide();
		}
	},


	/**
	 * 开启防弹衣
	 */
	StartBulProof: function(t)
	{
		this._timerBulprf = t;
	},


	/**
	 * 坦克升级
	 */
	Upgrade: function()
	{
		if(this._type < 3)
			this.SetType(this._type + 1);
	},


	/**
	 * 返回是否位于冰上
	 */
	OnIce: function()
	{
		// Math.floor(x / 16)
		return Const.BLOCK_ICE ==
				App.Scene.GetBlock4x4(this.X >> 4, this.Y >> 4);
	}
});