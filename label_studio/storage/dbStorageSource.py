from .base import BaseStorage
import logging
import os
from label_studio.models import Task, Completion, OldCompletion, UserScore
from label_studio import db
from label_studio.utils.io import json_load
from sqlalchemy import func

logger = logging.getLogger(__name__)


def checkAndgetTrainginTask(userID):
    q = db.session.query(Task.id).filter(Task.batch_id == 0, Task.format_type != 3).subquery()
    Taskcount = db.session.query(func.count(Completion.id)).filter(Completion.user_id == userID, Completion.task_id.in_(
        q)).scalar()  # .delete(synchronize_session='fetch')

    if Taskcount >= 2:
        print("Here 3", Taskcount)
        w = db.session.query(Completion).filter(Completion.user_id == userID,
                                                Completion.task_id.in_(q)).all()  # .delete(synchronize_session='fetch')
        for r in w:
            oldc = OldCompletion(user_id=r.user_id, task_id=r.task_id, data=r.data, completed_at=r.completed_at)
            db.session.add(oldc)
            db.session.delete(r)
        db.session.commit()

    nextTask = db.session.execute(
        'SELECT * FROM TrainingTask WHERE id not in (select task_id from completions where user_id = :userID ) order by id',
        {'userID': userID}).first()
    return nextTask


class JsonDBStorage(BaseStorage):

    description = 'JSON task file'
    def __init__(self, **kwargs):
        super(JsonDBStorage, self).__init__(**kwargs)
        if not self.importFromFile:
            logger.debug("returning flag set")
            return
        logger.debug("reading from File")
        Alltasks = {}
        if os.path.exists(self.path):
            Alltasks = json_load(self.path, int_keys=True)
        # logger.debug(Alltasks)
        # logger.debug(type(Alltasks))
        if len(Alltasks) != 0:
            for i, task in Alltasks.items():
                try:
                    # existing_task = Task.query.filter_by(username=username).first()
                    # if existing_task is None:
                    # logger.debug(SubTask)

                    # for task in SubTask:
                    # task = Alltasks[SubTask]
                    # logger.debug(type(task))
                    # logger.debug(task["data"])

                    dbtask = Task(text= task["data"]["text"], layout=task["data"]["layout"], groundTruth=task["data"]["groundTruth"])
                    db.session.add(dbtask)
                    db.session.commit()
                except Exception as e:
                    logger.debug("Storage db Error 3 ")
                    logger.debug(e)
        #     self.data = {}
        # elif isinstance(tasks, dict):
        #     self.data = tasks
        # elif isinstance(self.data, list):
        #     self.data = {int(task['id']): task for task in tasks}
        # self._save()

    # def _save(self):
    #     with open(self.path, mode='w', encoding='utf8') as fout:
            # json.dump(self.data, fout, ensure_ascii=False)


    @property
    def readable_path(self):
        return self.path

    def get(self, id):
        existing_task = Task.query.filter_by(id=id).first()
        if existing_task is not None:
            return existing_task
        return None
        # return self.data.get(int(id))

    def set(self, id, value):
        task = self.get(id)
        if task is not None:
            task.text = value["text"]
            task.layout = value["layout"]
            task.groundTruth = value["groundTruth"]
            # db.session.merge(task)
            db.session.commit()
        else:
            try:
                dbtask = Task(id=id,text=task["data"]["text"], layout=task["data"]["layout"],
                              groundTruth=task["data"]["groundTruth"])
                db.session.add(dbtask)
                db.session.commit()
            except Exception as e:
                logger.debug("Storage db Error ")
                logger.debug(e)
        # self.data[int(id)] = value
        # self._save()

    def __contains__(self, id):
        return self.get(id)
        # return id in self.data

    def set_many(self, ids, values):
        for id, value in zip(ids, values):
            self.set(id,value)
            # self.data[int(id)] = value
        # self._save()

    def ids(self):
        results = db.session.query(Task.id).all()
        return [value for value, in results]
        # return self.data.keys()

    def max_id(self):
        return db.session.query(db.func.max(Task.id)).scalar()
        # return max(self.ids(), default=-1)

    def items(self):
        return
        # return self.data.items()

    def nextTask(self, userID, traingTask):
        # db.session.query()
        nextTask = tuple
        # showDemo = 0
        userDemoFlag = UserScore.query.filter_by(user_id=userID, batch_id=0).first()
        if userDemoFlag == True or traingTask == '1':
            nextTask = checkAndgetTrainginTask(userID)
            # nextTask = db.session.execute(
            #     'SELECT * FROM TrainingTask WHERE id not in (select task_id from completions where user_id = :userID ) order by id',
            #       {'userID': userID}).first()
            # showDemo = 1
        else:
            # print("Here 5")
            # print("Here 1")
            # print(userScore)
            # if userScore < 20:
            #     nextTask = checkAndgetTrainginTask(userID)
            # else:
            nextTask = db.session.execute(
                'SELECT * FROM task WHERE  id not in (select task_id from completions where user_id = :userID ) order by id',
                {'userID': userID}).first()

        # logger.debug(nextTask)
        # logger.debug(type(nextTask))
        # for r in nextTask:
            # print(r[0])  # Access by positional index
            # print(r['my_column'])  # Access by column name as a string
            # r_dict = dict(r.items())  # convert to dict keyed by column names
            #  return r.__dict_
        if nextTask is None:
            return None
        dictTask = dict(nextTask.items())
        # dictTask["showDemo"] = showDemo
        return dictTask

    def remove(self, key):
        task = self.get(int(key))
        if task is not None:
            db.session.delete(task)
        # self.data.pop(int(key), None)
        # self._save()

    def remove_all(self):
        return
        # self.data = {}
        # self._save()

    def empty(self):
        return False
        # return len(self.data) == 0

    def sync(self):
        pass

