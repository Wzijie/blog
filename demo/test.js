
  import React from 'react';

  export default () => (<div className="md-block" dangerouslySetInnerHTML={{__html: `<h1>2019年终总结</h1>
<h2>前言</h2>
<p>直接进入正题，本篇总结以项目的里程碑以及一些自己觉得实现的比较好的功能，或者另自己产生成就感的代码，甚至一些优秀的代码片段来展开讲一下自己的2019。总结的同时并且记录自己做的一些东西。</p>
<p>接下来的主要内容涉及到代码片段，着重讲技术方面的内容，偏技术以及产品方面，并且因为是类似记录的形式所以可能有些流水账，如果不想看这些内容可以直接拉到最下面看本文总结。当然了都写出来了还是希望能至少粗略看一下。</p>
<h2>React高阶组件应用</h2>
<p>加入公司后公司给我的定位是维护考勤项目，所以初期的任务以熟悉考勤代码为主，在自己阅读代码的同时被安排到了修改一些简单bug的任务，其中一个bug为将项目中所有文本输入框去过滤emoji。</p>
<p>这个需求很简单，我只要在<code>input</code>的<code>onChange</code>事件中去做相关的正则过滤就行了，但是要将已存在的所有输入框的<code>onChange</code>事件中都去加入这一段逻辑吗，这显然不合理。</p>
<blockquote>
<p>高阶组件（HOC）是 React 中用于复用组件逻辑的一种高级技巧。</p>
</blockquote>
<p>这句React文档上的说明从我脑中想起，我需要使用高阶组件来解决逻辑复用的问题。这个高阶组件写起来也不复杂，就是为<code>onChange</code>事件加上过滤emoji的逻辑即可，但是秉承着基本的复用以及抽象的封装思想，这里不能写死这一种处理逻辑，万一以后要让我过滤特殊符号，又继续封装一个高阶组件吗，所以这里应该可以添加自定义的过滤文本逻辑。</p>
<p>这些处理文本的方法应该作为参数由使用方提供，最后定义接收的参数为一个处理方法组成的数组，这些处理方法接收到一个<code>value</code>参数，并且应该返回处理好的值。例如很简单的过滤左右空格</p>
<pre class="hljs"><code class="block"><span class="hljs-keyword">const</span> trim = <span class="hljs-function"><span class="hljs-params">value</span> =&gt;</span> value.trim();
</code></pre>
<p>然后要将这些一个个的处理方法按顺序执行，并且一个值处理完后将这个值传给下一个方法执行，类似一个管道通过后最终拿到经过所有方法处理后的值，实现如下</p>
<pre class="hljs"><code class="block"><span class="hljs-keyword">const</span> filterHandler = [trim];
<span class="hljs-keyword">const</span> nextValue = filterHandler.reduce(<span class="hljs-function">(<span class="hljs-params">prev, current</span>) =&gt;</span> current(prev), value);
</code></pre>
<p>拿到处理后的值就可以给到onChange方法了，完整代码如下</p>
<pre class="hljs"><code class="block"><span class="hljs-comment">// 针对input、textarea在onChange时对value进行处理，如过滤表情、过滤首尾空格等</span>
<span class="hljs-keyword">const</span> getFormValueDecorator = <span class="hljs-function">(<span class="hljs-params">filterHandler = []</span>) =&gt;</span> {
  <span class="hljs-keyword">return</span> <span class="hljs-function"><span class="hljs-params">Component</span> =&gt;</span> {
    <span class="hljs-keyword">const</span> { children, onChange, ...restProps } = Component.props;
    <span class="hljs-keyword">const</span> onPrevChange = <span class="hljs-function"><span class="hljs-params">value</span> =&gt;</span> {
      <span class="hljs-keyword">const</span> nextValue = filterHandler.reduce(<span class="hljs-function">(<span class="hljs-params">prev, current</span>) =&gt;</span> current(prev), value);
      onChange(nextValue);
    }
    <span class="hljs-keyword">return</span> (
      <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Component.type</span> {<span class="hljs-attr">...restProps</span>} <span class="hljs-attr">onChange</span>=<span class="hljs-string">{onPrevChange}</span>&gt;</span>
        {children}
      <span class="hljs-tag">&lt;/<span class="hljs-name">Component.type</span>&gt;</span></span>
    );
  }
}

<span class="hljs-comment">// example</span>
&lt;div&gt;
  {getFormValueDecorator([trim, filterEmoji])(
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">InputItem</span>
      <span class="hljs-attr">type</span>=<span class="hljs-string">"text"</span>
      <span class="hljs-attr">placeholder</span>=<span class="hljs-string">"请输入用户名"</span>
      <span class="hljs-attr">value</span>=<span class="hljs-string">{username}</span>
      <span class="hljs-attr">onChange</span>=<span class="hljs-string">{this.onChange}</span>
    &gt;</span>
      用户名
    <span class="hljs-tag">&lt;/<span class="hljs-name">InputItem</span>&gt;</span></span>
  )}
&lt;div&gt;
</code></pre>
<p>在这之前对于高阶组件的了解也仅限于查阅过文档，这是第一次将高阶组件运用到实战中，并且切实的有针对性的解决了在项目中遇到的难点，对于自己的实现方式也比较满意。</p>
<h2>考勤WiFi打卡</h2>
<p>在熟悉完项目代码后就正式进入了项目的迭代开发，在经过一两个小版本后迎来了一个较大的版本迭代，也就是增加WiFi打卡功能，此前考勤只能地点打卡，WiFi打卡对于考勤类的应用来说也是必不可少的功能。</p>
<p>需求分为在首页获取WiFi打卡以及在排班设置中设置WiFi打卡类型，我是负责在排班设置中新增WiFi类型的，因为此时还有另一个小伙伴帮我做首页打卡的功能。</p>
<p>JS并没有提供获取WiFi的接口，理论上也不会有，因为浏览器不可能给网页那么大的权力去获取客户端一些较隐私的内容，所以获取WiFi的功能是由native提供的。这里也是第一次了解了怎么跟native交互，做起来也是比较简单顺利，<s>除了企业微信</s>。</p>
<h2>考勤首屏加载优化</h2>
<p>紧接着WiFi考勤版本后，不久后反馈首页白屏时间过长的用户越来越多，不得不将首屏优化提上日程，这里就只列出我优化的一些点</p>
<ul>
<li>从体验上优化，在渲染容器节点内增加骨架屏HTML，展示一个骨架屏至少要比白屏体验好。</li>
<li>压缩图片</li>
<li>增加打包进CSS的图标大小要求，只有小于1kb的图片转换成base64打包进CSS文件。</li>
<li>拆分CSS文件，原有的base.css集合了mixin以及variable，导致想引用一些变量的时候引入了多余的内容。</li>
</ul>
<p>这里着重讲一下第一点，正常来说当HTML加载完毕后就能看到骨架屏了，不需要等待主要的JS与CSS加载完成，但实际要等待CSS加载完毕才会展示这个骨架屏，原因是浏览器会等所有CSS加载完毕后再渲染首屏，一起应用样式，力求一步完成，而不是加载一点渲染一点。</p>
<p>解决方法就是告诉浏览器先渲染骨架屏，index.css不重要，不需要等待它加载完，实现代码如下</p>
<pre class="hljs"><code class="block"><span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">"preload"</span> <span class="hljs-attr">href</span>=<span class="hljs-string">"index.css"</span> <span class="hljs-attr">as</span>=<span class="hljs-string">"style"</span> <span class="hljs-attr">onload</span>=<span class="hljs-string">"this.rel='stylesheet'"</span>&gt;</span>
</code></pre>
<p>核心是<code>rel=&quot;preload&quot;</code>，这里简单来说是告诉浏览器这个样式文件可以延后加载，不要阻塞页面的初步渲染。</p>
<h2>手动管理浏览器的history</h2>
<p>某天，某产品叫我去开会，<s>跟我说从哪来回哪去，我？？？？</s>。进入正题，这个版本的需求是整理项目中页面返回混乱的问题，混乱是指返回回到了上上个页面的问题，所以产品明示页面从哪进来的返回就应该回哪去。到这里都没什么问题，直到跟我说弹窗可以通过浏览器的返回按钮关闭，我听到这个需求第一时间就想口吐芬芳开始反驳，因为浏览器的返回只是根据页面记录返回而已，基于这个我觉得这个需求不合理。正当我想反驳时我的脑子告诉我，这个东西可以做，并且我已经想好大概要怎么做且有哪些api支持我的做法。在经过这一系列的思考后我脱口而出的只是：过，下一个需求......</p>
<p>再次进入正题，在讲实现思路前要讲有哪些api需要用到，首先是<code>history</code>对象，<code>history</code>对象提供了控制浏览器history的接口，接着是popstate事件，这个事件当浏览器history改变时触发。已知这些api后实现思路也油然而生，就是监听popstate事件做一些类似弹窗关闭的操作，并且会由浏览器的返回按钮触发。举个栗子，当打开弹窗会经理如下流程</p>
<ol>
<li>调用<code>history.pushState</code>往前前进一步，并且用一个随机的key作为标记放入state中。</li>
<li>监听popstate事件，回调中要做的就是判断key是否相同，相同则执行对应的关闭方法（关闭弹窗。</li>
</ol>
<p>基于这个思路实现，完整代码如下</p>
<pre class="hljs"><code class="block">  <span class="hljs-keyword">const</span> historyStackPush = <span class="hljs-function"><span class="hljs-params">gobackCB</span> =&gt;</span> {
    <span class="hljs-keyword">const</span> stackKey = <span class="hljs-built_in">Math</span>.random().toString(<span class="hljs-number">16</span>).slice(<span class="hljs-number">2</span>);
    history.replaceState({ stackKey }, <span class="hljs-literal">null</span>, location.href);
    history.pushState(<span class="hljs-literal">null</span>, <span class="hljs-literal">null</span>, location.href);

    <span class="hljs-keyword">const</span> onBeforeunloadHandler = <span class="hljs-function"><span class="hljs-params">()</span> =&gt;</span> {
      <span class="hljs-keyword">const</span> keys = <span class="hljs-built_in">JSON</span>.parse(localStorage.getItem(HISTORY_STACK_PUSH_KEY) || <span class="hljs-string">'[]'</span>);
      keys.push(stackKey);
      localStorage.setItem(HISTORY_STACK_PUSH_KEY, <span class="hljs-built_in">JSON</span>.stringify(keys));
    }

    <span class="hljs-keyword">const</span> onPopstateHandler = <span class="hljs-function"><span class="hljs-params">e</span> =&gt;</span> {
      <span class="hljs-keyword">if</span> (e.state &amp;&amp; e.state.stackKey === stackKey) {
        gobackCB();
        <span class="hljs-built_in">window</span>.removeEventListener(<span class="hljs-string">'popstate'</span>, onPopstateHandler);
        <span class="hljs-built_in">window</span>.removeEventListener(<span class="hljs-string">'beforeunload'</span>, onBeforeunloadHandler);
      }
    }

    <span class="hljs-built_in">window</span>.addEventListener(<span class="hljs-string">'popstate'</span>, onPopstateHandler);
    <span class="hljs-built_in">window</span>.addEventListener(<span class="hljs-string">'beforeunload'</span>, onBeforeunloadHandler);

    <span class="hljs-keyword">const</span> clearHandler = <span class="hljs-function"><span class="hljs-params">()</span> =&gt;</span> {
      <span class="hljs-built_in">window</span>.removeEventListener(<span class="hljs-string">'popstate'</span>, onPopstateHandler);
      <span class="hljs-built_in">window</span>.removeEventListener(<span class="hljs-string">'beforeunload'</span>, onBeforeunloadHandler);
      history.back();
    }
    <span class="hljs-keyword">return</span> clearHandler;
  }
</code></pre>
<h2>考勤跨天排班</h2>
<p><s>在这里只想说一句我当时真没想到我能把这个需求实现。</s>，当时我真正的想法是我必把你这个逻辑理顺</p>
<h2>流程审批应用</h2>
<p>在年中的时候我被安排到了开发一个新的项目也就是流程审批，需要使用vue技术栈来开发，但我此前并没有使用vue的经验，当然了vue非常容易上手，我也是借由此机会学习了vue。</p>
<hr>
<pre class="hljs"><code class="block"><span class="hljs-comment">// 介于篇幅原因到这里就结束了，其实还有挺多没有列出来的</span>
</code></pre>
<h2>总结</h2>
<p>去年一整年感觉都很忙啊，最忙的时候都想不思考最优解了，想到怎么做第一时间就开始撸，但是秉承着一个程序猿的基本素养，我马上就把这个想法抛于脑后了，如果自己写的代码把自己都恶心到了，那还有什么意义呢，毕竟写代码最重要是开心。</p>
<p>年底了开始思考自己这一年的技术有提升吗，对于自己技术的提升与否是非常看重的，但是在业务繁重需求不断的情况下如何提升自己的技术呢，毕竟大部分业务较重复和简单，我的做法也只是像上面说的，在撸业务的同时不要停止思考代码实现方式的最优解。最后希望自己明年的技术能更上一层楼吧。</p>
`}} />);
