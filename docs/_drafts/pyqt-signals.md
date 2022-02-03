---
layout: post
title:  "PyQt Custom Signals"
description: ""
date:   2021-06-02 13:48 -0400
tags: pyqt
permalink: /:title/
---

signals in qt ...

custom signals must be declared as class attributes in order to be bound to the instantiated object. something something c++ qt. I understand this was implemented in [PyQt4](https://www.riverbankcomputing.com/static/Docs/PyQt4/new_style_signals_slots.html)
<!-- old version reference: https://doc.bccnsoft.com/docs/PyQt4/old_style_signals_slots.html -->

<!-- on signal signatures btw, just for fun: https://www.riverbankcomputing.com/pipermail/pyqt/2018-September/040828.html -->

signals are great for multithreaded apps. worker threads can't update gui (pyqt rule), so they should signal the main thread instead.

here's the standard usage:

```python
class TypicalQObject(QObject):
    signal = pyqtSignal()
    # maybe this is a meaningful class that does work, but maybe not

o = TypicalQObject()
o.signal.connect(lambda: print('signal in a typical qobject'))
o.signal.emit()
```

Reasons for the pattern, according to PyQt4 devs:
"New signals defined in this way will be automatically added to the class’s QMetaObject. This means that they will appear in Qt Designer and can be introspected using the QMetaObject API."

-

>>> New signals should only be defined in sub-classes of QObject. They must be part of the class definition and cannot be dynamically added as class attributes after the class has been defined. [source](https://www.riverbankcomputing.com/static/Docs/PyQt4/new_style_signals_slots.html)

<!-- interesting note about benefits of decorating a connected function as a pyqtSlot, ven tho i wasn't focused on slots:
Connecting a signal to a decorated Python method also has the advantage of reducing the amount of memory used and is slightly faster. (same source) -->



Reasons against the pattern:
- clumsy and not intuitive; signals make sense as object-level attributes, not forced class attributes.
    - [people](https://stackoverflow.com/a/45620056) [often](https://stackoverflow.com/a/36435321) [define](https://zetcode.com/gui/pyqt5/eventssignals/) [a](https://stackoverflow.com/a/17483765) class just for holding a signal or [get](https://forum.qt.io/topic/101616/pyside2-qtcore-signal-object-has-no-attribute-emit/10) [confused](https://stackoverflow.com/q/52627074) [that](https://stackoverflow.com/q/37630233) it even needs to be a class attribute in the first place; the behavior is adulterated with c++ implementation, which is probably be a common problem when binding to another language, but extra confusing nonetheless and solveable here.
- not dynamic; not usually a big deal since signaling logic is a design choice before runtime, but still - it's nice to have options beyond hard-coding.
<!-- this guy had some more complaints https://stackoverflow.com/questions/21101500/custom-pyqtsignal-implementation -->
<!-- this guy was extending a qt object that wasn't QObject so he had to have the signal outside https://stackoverflow.com/a/17483765 -->

The core problem is that a signal must belong to a particular ~~object~~ class. Can we just treat signals as independent objects?

___

## Solution:

#### Dummy classes for holding signals

This is the dynamic alternative to hard-coding a signal in a class definition.

Fun fact: [`type()`](https://docs.python.org/3/library/functions.html#type) is overloaded beyond the usual `type(object)`. You can dynamically create classes with it!

```python
  dummy_class = type(
      'irrelevant', # class name
      (QObject,),   # base classes
      dict(         # class attributes and methods
          signal=pyqtSignal()
      )
  )

  obj = dummy_class()
  print( type(obj) )
  print( obj.signal )
  # >>> <class '__main.irrelevant'>
  # >>> <bound PYQT_SIGNAL signal of irrelevant object at 0x0378F850>
```

Wrapped in a function:
```python
def create_signal_holder(name):
    # dynamically create a class with a signal and return instantiated
    return type(
        name, # needs unique name
        (QObject,),
        dict(       
            signal=pyqtSignal()
        )
    )()
```

Function demo:
```python
# now we can make a lot
signal_holders = [
    create_signal_holder(str(i))
    for i in range(10)
]
# and use them
for obj in signal_holders:
    s = obj.signal
    s.connect(lambda: print(type(obj)) )
    s.emit()

# >>> <class '__main__.0'>
# >>> <class '__main__.1'>
# >>> ...
# >>> <class '__main__.9'>
```
It would be nice to disregard the objects holding the signals and instead store only the signals themselves, but that doesn't work. I think the objects get garbage collected and it ruins the signals' bindings. Not a big deal, especially as all this will be hidden in the final implementation:

#### Put in a class

```python
class SignalCollection:

    def __getitem__(self, signal_name):
        if getattr(self, signal_name, None) is None:
            setattr(self, signal_name, create_signal_holder(signal_name))
        return getattr(self, signal_name).signal

signals = SignalCollection()
```

Surprisingly short! All custom signal creation and storage is contained in this one dict-like object. Makes a new signal if the given name hasn't been accessed before. No need to worry any more about binding or classes or anything. Get a signal when you need it. Simpler, as it should be.

```python
signals['a'].connect(lambda: print('signal a was implicitly made, and now it has been emitted'))
signals['a'].emit()
```

More useful example, signaling from a thread:

```python
# multithreaded:
app = QApplication([])  # need event loop running for multithread to work

def emit_and_close():
    signals['b'].emit()
    sleep(0.5)  # without this, sometimes app quit early before callback had a chance to execute
    app.quit()

signals['b'].connect(lambda: print('b emitted'))
Thread(target=emit_and_close).start()

sys.exit(app.exec_())

```
___
#### Re-featuring

A nice feature of signals is the option to emit data during the event. Those data types are defined when creating a signal, eg. `signal = pyqtSignal(int, str)`. So a small edit to make that option possible:

```python
def create_signal_holder(name, *types):
    # any types will be pyqtSignal() args
    return type(
        name,
        (QObject,),
        dict(
            signal=pyqtSignal(*types)
        )
    )()

# eg. create_signal_holder('name', int, str)
```

and reflected in the class:
```python
class SignalCollection:

    def add_signal(self, signal_name, *types):
        setattr(self, signal_name, create_signal_holder(signal_name, *types))

    def __getitem__(self, signal_name):
        if getattr(self, signal_name, None) is None:
            setattr(self, signal_name, create_signal_holder(signal_name))
        # print(getattr(self, signal_name))
        return getattr(self, signal_name).signal
```

Gotta specifically add a signal with data types before retrieving it, but that's ok.



___
J. Wong <br />
May 4, 2021 <br />
Python 3.7 <br />
PyQt5
