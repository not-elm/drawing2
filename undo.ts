

export interface Undo{
    push()

    undo(): Redo | undefined
}

export interface Redo{
    redo(): Undo | undefined
}

export class UndoSequence implements Undo{
    private readonly sequence: Undo[] = []

    push(undo: Undo){
        this.sequence.push(undo)
    }

    undo(){
        const undo = this.sequence.pop()
        if(undo){
            return undo
        }
    }
}

export class MarkUndo implements Undo{
    private readonly marks: Undo[] = []

    constructor(base: Undo){
        this.mark = [base]
    }

    push(){
        this.mark.push()
    }

    undo(){
        const redos = []
        for (const mark of this.marks) {
            redos.push(mark.undo());
        }
        return new RedoMark(redos)
    }
}

export class UndoStack{
    private readonly stack: Undo[] = []

    push(undo: Undo){
        this.stack.push(undo)
    }

    undo(){
        const undo = this.stack.pop()
        if(undo){
            return undo
        }
    }
}