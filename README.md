# zkSlide
Simple, yet powerful, JavaScript slider (still in development)

# Usage
To use the slider in a webpage, first include the files (style.css and js.js) in the page.
Then, you'll just need to create a div in this form:

```html
<div class="zkslide">
	<div>First slide</div>
	<div>Second slide</div>
	<div>Third slide</div>
</div>
```

The content of the slides can be virtually anything, from simple images to complex layouts.

# Slider Size
The slider is meant to costantly adapt to the content of the currently shown slides, so they have to have a certain width and height for it to read (either implicit, by its contents, or explicit, set with the options).

# Options
Every slider has a variety of options that can be set, via the "data-" attributes.
So, for example, if I want to set the "width", I should set it this way:
```html
<div class="zkslide" data-width="800px">
```

The possible attributes are the following:

- id:
	Every slider in the page (you can have as many as you want in the page) has its own alphanumeric id.
	You can manually set it via this attribute, otherwise it will be auto-assigned as an auto-increment value.
- width:
	The width, in any accepted CSS unit (px, %, etc...), of the slider.
	If it's not declared, it will be set to auto, and the slider will try to adapt to the content of the slides.
- height:
	The height, in any accepted CSS unit (px, %, etc...), of the slider.
	If it's not declared, it will be set to auto, and the slider will try to adapt to the content of the slides.
- type (default "slide"):
	The type of transition; it can be either "slide" or "fade"
- direction (default "o"):
	In a "slide" type of transition, this attribute defines the direction of the transition ("o" for horizontal scrolling, "v" for vertical scrolling)
- force-width (default "true"):
	If set to "true" (as it is by default), the single slide width will be fixed to the width of the whole slider (or a fraction of it, in case of multiple visible slides).
	Otherwise, every slide will be able to have its own width.
- force-height (default "true"):
	If set to "true" (as it is by default), the single slide height will be fixed to the width of the whole slider (or a fraction of it, in case of multiple visible slides).
	Otherwise, every slide will be able to have its own height.
- visible (default 1):
	The number of slides simultaneously visible in the slider. In case of a forced width or height (depending on the direction), the slides will be sized to a fraction of the whole.
	For example, if the whole slider is 800px large, and there are 2 slides visible, every slide will be 400px.
- interval (default false):
	Set to the number of milliseconds you want to have as the interval between one slide and the next one.
- step (default 1):
    Number of slides to move together in the auto-scroll, if it was set above.
 - callback (default empty):
     You can set a JavaScript callback that will be called every time the slider moves (either manually or with the auto-interval).
     It takes a single parameter, representing the index of the slide it has moved to.
     It is also called at the page loading, with the index of the initial slide.
     It should be set in this form: data-callback="function(n){ /* your code here */ }"

# Moving the slider

Beside setting the interval for an auto-scrolling, you can manually move the slider via the function zkMoveSlide, in three different ways:
 - zkMoveSlide(id, 3): this will move the slider to the 3rd slide
 - zkMoveSlide(id, '+3'): this will move the slider forward by 3 slides (if you are on the 2nd one, you'll end up in the 5th)
 - zkMoveSlide(id, '-2'): this will move the slider backward by 2 slides (if you are on the 3rd one, you'll end up in the first)