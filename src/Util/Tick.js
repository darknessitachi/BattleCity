/**
 * 自动复位计数器
 *
 * 例：
 *   var t = new Tick(3); //定义步长为3的计数器
 *   t.On();              //返回false (内部计数=2)
 *   t.On();              //返回false (内部计数=1)
 *   t.On();              //返回true  (内部计数=0，重置到3)
 */
function Tick(count)
{
	var t = count;

	this.On = function()
	{
		if(--t)
		{
			return false;
		}
		else
		{
			t = count;
			return true;
		}
	};

	this.Reset = function(new_count)
	{
		if(new_count != null)
			t = count = new_count;
		else
			t = count;
	};
}