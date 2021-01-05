import sys
import json
import pathlib
import logging.config
import label_studio
# import flask_login
# from label_studio import db
# import click

from colorama import Fore
try:
    from boxing import boxing
except:
    # boxing is broken for Python3.5
    boxing = lambda x, **kwargs: x

from label_studio.utils.misc import get_latest_version, current_version_is_outdated

_HERE = pathlib.Path(__file__).resolve()
LOG_CONFIG_PATH = _HERE.parent / "logger.json"


def create_app(*args, **kwargs):
    """ Public create application factory
    """
    from label_studio.blueprint import create_app
    return create_app(*args, **kwargs)


def setup_default_logging_config():
    """ Setup default logging for Label Studio blueprint
    """
    with LOG_CONFIG_PATH.open(encoding='utf8') as f:
        logging.config.dictConfig(json.load(f))


def check_for_the_latest_version():
    latest_version = get_latest_version()

    def update_package_message():
        update_command = Fore.CYAN + 'pip install -U ' + label_studio.package_name + Fore.RESET
        return boxing(
            'Update available {curr_version} → {latest_version}\nRun {command}'.format(
                curr_version=label_studio.__version__,
                latest_version=latest_version,
                command=update_command
            ), style='double')

    if latest_version and current_version_is_outdated(latest_version):
        print(update_package_message())


def main():
    # configure logging before importing any label_studio code
    setup_default_logging_config()

    # Check for fresh updates
    check_for_the_latest_version()

    from label_studio.blueprint import main
    return main()

    # while True:
    #     input = input("Enter number :")
    #     if input == "exit":
    #         return

# @app.cli.command("loadtasksold")
# @click.argument('input', type=click.File('rb'))
# def loadtasksold(input):
#     Alltasks = json.loads(input.read())
#     # logger.debug(Alltasks)
#     from .models import Task
#     if len(Alltasks) != 0:
#         for i, task in Alltasks.items():
#             try:
#                 dbtask = Task(text=task["data"]["text"], layout=task["data"]["layout"],
#                               groundTruth=task["data"]["groundTruth"])
#                 db.session.add(dbtask)
#                 db.session.commit()
#             except Exception as e:
#                 logger.debug("Storage db Error 3 ")
#                 logger.debug(e)

# @app.cli.command("loadtasks")
# @click.argument('input', type=click.File('rb'))
# def loadtasks(input):
#     Alltasks = json.loads(input.read())
#     # logger.debug(Alltasks)
#     from .models import Task
#     if len(Alltasks) != 0:
#         for task in Alltasks:
#             try:
#                 dbtask = Task(text=task["data"]["text"], layout_id=task["data"]["layout"],
#                               groundTruth=task["data"]["groundTruth"])
#                 db.session.add(dbtask)
#                 db.session.commit()
#             except Exception as e:
#                 print("Storage db Error 3 ")
#                 print(e)

# @app.cli.command("loadlayout")
# @click.argument('input', type=click.File('rb'))
# def loadlayout(input):
#     layouts = json.loads(input.read())
#     # print(layouts)
#     # logger.debug(layouts)
#     from .models import Task
#     if len(layouts) != 0:
#         for layout in layouts:
#             # text = "test"
#             print(layout)
#             print(type(layout))
#             # print(layouts[0])
#             try:
#                 if "id" in layout and layout["id"] is not None:
#                     print("FOUND")
#                     db_layout = Layout.query.filter_by(id=layout["id"]).first()
#                     if db_layout is not None:
#                         db_layout.data = layout["text"]
#                         db.session.add(db_layout)
#                         db.session.commit()
#                     else:
#                         db_layout = Layout(data=layout["text"])
#                         db.session.add(db_layout)
#                         db.session.commit()

#                 else:
#                     db_layout = Layout(data=layout["text"])
#                     db.session.add(db_layout)
#                     db.session.commit()
#             except Exception as e:
#                 print(e)
#                 logger.debug("Storage db Error - loadLaout 3 ")
#                 logger.debug(e)

if __name__ == "__main__":
    sys.exit(main())
