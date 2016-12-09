/****************************************
 * 子弹类
 ****************************************/

/**
 * 子弹状态机
 * @enum {number}
 */
var BullState =
{
	NONE: 0,
	FIRE: 1,
	BOOM: 2,
	RESET: 3
};


/**
 * 子弹移动状态
 * @enum {number}
 */
var HitState =
{
	NONE: 0,
	HIT: 1,
	MISS: 2
};




var Bullet = Class(
{
	_state: BullState.NONE,	// 状态机
	_team: 0,				// 队伍
	_sptBul: null,
	_boom: null,


	X:0, Y:0,		// 位置
	Dir:0,			// 方向
	Speed:0,		// 速度
	Pow:0,			// 是否加强子弹



	Bullet: function(team)
	{
		//
		// 创建子弹精灵
		//
		this._sptBul = new Sprite("res/Misc.png", 8, 8);
		this._sptBul.Hide();
		this._sptBul.SetZ(Const.Z_BULL);
		App.GameUI.Append(this._sptBul);

		// 子弹所属的队伍
		this._team = team;

		// 小型爆炸
		this._boom = new Boom(false);
	},


	/**
	 * 子弹逻辑更新
	 */
	Update: function()
	{
		switch(this._state)
		{
		case BullState.NONE:			// -空闲状态
			break;

		case BullState.FIRE:			// -发射状态
			for(var i = 0; i < this.Speed; ++i)
			{
				switch(this._Go())
				{
				//
				// 击中物体，子弹爆炸
				//
				case HitState.HIT:
					this._boom.Start(this.X - 28, this.Y - 28);
					this._state = BullState.BOOM;
					return;

				//
				// 子弹消失
				//
				case HitState.MISS:
					this._state = BullState.RESET;
					return;
				}

				switch(this.Dir)
				{
				case 0:		//上
					this.Y -= 2;
					break;
				case 1:		//右
					this.X += 2;
					break;
				case 2:		//下
					this.Y += 2;
					break;
				case 3:		//左
					this.X -= 2;
					break;
				}

				// 更新子弹位置
				this._sptBul.Move(Const.POS_X + this.X, Const.POS_Y + this.Y);
			}
			break;

		case BullState.BOOM:			// -爆炸状态
			if(this._boom.Update())
				this._state = BullState.RESET;
			break;

		case BullState.RESET:			// -重置状态
			this._sptBul.Hide();
			this._state = BullState.NONE;
			break;
		}
	},


	/**
	 * 返回子弹是否为空闲
	 */
	IsIdle: function()
	{
		return this._state == BullState.NONE;
	},


	/**
	 * 发射子弹
	 */
	Shot: function(x, y, dir)
	{
		//
		// 调整子弹到坦克前方的位置
		//
		switch(dir)
		{
		case 0:		//上
			x += 12;
			y -= 8;
			break;
		case 1:		//右
			x += 32;
			y += 12;
			break;
		case 2:		//下
			x += 12;
			y += 32;
			break;
		case 3:		//左
			x -= 8;
			y += 12;
			break;
		}

		this._sptBul.Move(Const.POS_X + x, Const.POS_Y + y);
		this._sptBul.SetFrame(dir);		//设置方向
		this._sptBul.Show();

		this.X = x;
		this.Y = y;
		this.Dir = dir;

		this._state = BullState.FIRE;
	},


	/**
	 * 重置子弹
	 */
	Reset: function()
	{
		this._sptBul.Hide();
		this._boom.Reset();

		this._state = BullState.NONE;
	},


	/**
	 * 子弹移动
	 */
	_Go: function()
	{
		/**
		 * 返回值
		 *   0：子弹继续前进
		 *   1: 子弹碰到物体
		 *   2：子弹抵消
		 */
		var ret = HitState.NONE;

		var p, q, r;
		var b1, b2;

		var B = App.Scene.Block;
		var x = this.X;
		var y = this.Y;


		/**
		 * 子弹击中砖块（向上的情况）：
		 *
		 * ||===========||===========||
		 * ||     |     ||     |     ||
		 * ||---- ? ----||---- ? ----||
		 * ||     |     ||     |     ||
		 * ||===========||===========||
		 * ||  1  |  2  ||  1  |  2  ||
		 * ||---- L ----||---- R ----||
		 * ||  4  |  8  ||  4  |  8  ||
		 * ||===========||===========||
		 *              /\
		 *             /  \ 
		 *             |__|
		 *
		 *  L => block[r][p]  (左边的block)
		 *  R => block[r][q]  (右边的block)
		 *
		 *  击中砖块的同时，
		 *  可以消去同方向的另一砖块。
		 *
		 *  普通子弹：
		 *      击中L的8号砖，则L的4号砖也同时消去（如果存在的话）；
		 *      如果不存在8号，4号则不受影响；
		 *
		 *      击中L的8号砖之后，如果R是铁块，子弹停止；
		 *      否则子弹继续向上，检测L的2号和1号。
		 *      （一次打掉半个block砖）
		 *
		 *  加强子弹：
		 *      ...
		 *
		 *      击中L的8号砖之后，不论R是否为铁块，子弹都将继续。
		 *      （一次可以打掉一个block砖）
		 *
		 *
		 *  另一边同理。
		 *  其他方向的子弹同理。
		 */
		switch(this.Dir)
		{
		/******************************************
		 * 子弹: 上
		 *****************************************/
		case 0:
			// 以子弹尾部为准
			y += 8;

			// 飞出视野
			if(y <= 0)
				return 1;

			// 没有和地块接触
			if(y % 16)
				break;

			r = y / 16 - 1;
			p = x >> 4;			// p = Math.floor(x / 16)
			q = p + 1;

			b1 = B[r][p];	// 左
			b2 = B[r][q];	// 右

			if(b1 & 0xF)
				ret	= this._TileHit(b1, b2, p, r, 8, 4, 2, 1);
			if(b2 & 0xF)
				ret |= this._TileHit(b2, b1, q, r, 4, 8, 1, 2);
			break;

		/******************************************
		 * 子弹: 右
		 *****************************************/
		case 1:
			if(x >= 416)
				return 1;

			if(x % 16)
				break;

			r = x / 16;
			p = y >> 4;
			q = p + 1;

			b1 = B[p][r];	// 上
			b2 = B[q][r];	// 下

			if(b1 & 0xF)
				ret = this._TileHit(b1, b2, r, p, 4, 1, 8, 2);
			if(b2 & 0xF)
				ret |= this._TileHit(b2, b1, r, q, 1, 4, 2, 8);
			break;

		/******************************************
		 * 子弹: 下
		 *****************************************/
		case 2:
			if(y >= 416)
				return 1;

			if(y % 16)
				break;

			r = y / 16;
			p = x >> 4;
			q = p + 1;

			b1 = B[r][p];	// 左
			b2 = B[r][q];	// 右

			if(b1 & 0xF)
				ret = this._TileHit(b1, b2, p, r, 2, 1, 8, 4);
			if(b2 & 0xF)
				ret |= this._TileHit(b2, b1, q, r, 1, 2, 4, 8);
			break;

		/******************************************
		 * 子弹: 左
		 *****************************************/
		case 3:
			x += 8;

			if(x <= 0)
				return 1;

			if(x % 16)
				break;

			r = x / 16 - 1;
			p = y >> 4;
			q = p + 1;

			b1 = B[p][r];	// 上
			b2 = B[q][r];	// 下

			if(b1 & 0xF)
				ret = this._TileHit(b1, b2, r, p, 8, 2, 4, 1);
			if(b2 & 0xF)
				ret |= this._TileHit(b2, b1, r, q, 2, 8, 1, 4);
			break;
		}


		//
		// 检测铁块是否能打掉
		//
		if(b1 == Const.BLOCK_IRON)
		{
			ret = HitState.HIT;
			if(this.Pow)
			{
				if(this.Dir==1 || this.Dir==3)
					App.Scene.SetIronFrag(r, p, Const.BLOCK_NONE);	// 横向
				else
					App.Scene.SetIronFrag(p, r, Const.BLOCK_NONE);	// 纵向
			}
		}

		if(b2 == Const.BLOCK_IRON)
		{
			ret = HitState.HIT;
			if(this.Pow)
			{
				if(this.Dir==1 || this.Dir==3)
					App.Scene.SetIronFrag(r, q, Const.BLOCK_NONE);	// 横向
				else
					App.Scene.SetIronFrag(q, r, Const.BLOCK_NONE);	// 纵向
			}
		}


		//
		// 是否打到总部
		//
		if(b1 == Const.BLOCK_BASE1 || b2 == Const.BLOCK_BASE1)
		{
			App.Game.BaseDestroy();
			ret = HitState.HIT;
		}


		//
		// 碰撞检测
		//
		var tanks = App.Scene.Tanks;
		var tank, bul;
		var i, j;

		for(i = 0; i < Const.MAX_TANK; ++i)
		{
			tank = tanks[i];

			//
			// 跳过同一队伍的
			//
			if(tank.Team == this._team || !tank.IsLive())
				continue;

			//
			// 子弹与坦克的碰撞
			//
			if(tank.CheckColl(this._sptBul))
			{
				if(HitState.MISS == tank.Hit())	// 打到防弹衣
					return HitState.MISS;
				else							// 打到坦克（不一定要打爆）
					return HitState.HIT;
			}

			//
			// 与对方坦克的子弹碰撞
			//
			for(j = 0; j < tank.BulMax; j++)
			{
				bul = tank.Bullets[j];

				if(bul._state == BullState.FIRE)
				{
					if(bul._sptBul.CollidesWith(this._sptBul))
					{
						// 对家的子弹也消失
						bul._state = BullState.RESET;
						return HitState.MISS;
					}
				}
			}
		}

		return ret;
	},


	/**
	 * 子弹与砖块的撞击
	 */
	_TileHit: function(b1, b2, col, row, p1, p2, q1, q2)
	{
		var hit = 0;

		if(b1 & p1)
		{
			b1 &= ~p1;			// 当前块
			if(b1 & p2)			// 同方向扩散
				b1 &= ~p2;
			hit = 1;
		}

		if(b1 & q1)				// 后面块
		{
			/**
			 * 加强子弹可以一次打两层砖。
			 * 普通子弹只有前面块不存在，
			 *    并且旁边不是铁块，
			 *    才可以打后面块。
			 */
			if(this.Pow || (hit == 0 && b2 != Const.BLOCK_IRON))
			{
				b1 &= ~q1;
				if(b1 &= q2)	// 同方向扩散
					b1 &= ~q2;
				hit = 1;
			}
		}

		if(hit)
			App.Scene.SetTileFrag(col, row, b1);

		return hit;
	}
});