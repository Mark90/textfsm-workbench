from textwrap import dedent

import pytest
import textfsm

from main import parse_textfsm


def test_parse_textfsm_ok():
    template = dedent(
        r"""
        Value FirstName ([\w]+)
        Value LastName ([\w]+)

        Start
          ^${FirstName}.${LastName}
       """
    )
    output, _ = parse_textfsm("a b c", template)
    assert {"FirstName": "a", "LastName": "b"} in output


def test_parse_textfsm_exc():
    template = dedent(
        r"""
        Value firstName ([\w]+)
        Value LastName ([\w]+)

        Start
          ^${FirstName}.${LastName}
       """
    )
    with pytest.raises(textfsm.Error):
        output, _ = parse_textfsm("a b c", template)
